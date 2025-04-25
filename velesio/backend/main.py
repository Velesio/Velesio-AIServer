import threading
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse 
import subprocess
import psutil
import os
import requests
import logging
import shlex
from pydantic import BaseModel
import signal
import urllib.parse
import os.path
from typing import Dict, Optional, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise

# --- Port Mapping ---
# Define the available external ports and their mapping to internal ports
# Nginx listens on external ports and proxies to internal ports
PORT_MAPPING: Dict[int, int] = {
    1337: 1338,
    1339: 1340,
    1341: 1342,
    1343: 1344,
    1345: 1346,
}
AVAILABLE_EXTERNAL_PORTS: List[int] = list(PORT_MAPPING.keys())

# Store running LLM instances: {internal_port: {'process': process_object, 'config': config_dict, 'log_file': path, 'external_port': ext_port}}
llm_instances: Dict[int, Dict] = {}
stable_diffusion_process = None
sd_log_file = "/app/sd_logs.txt"

# Define allowlist file paths
ALLOWLIST_FILES = {
    "frontend": "/etc/nginx/allowed_ips_frontend.conf",
    "llm": "/etc/nginx/allowed_ips_llm.conf",
    "sd": "/etc/nginx/allowed_ips_sd.conf",
}

# Define Pydantic models
class LLMInstanceConfig(BaseModel):
    model: str
    external_port: int  # User specifies the desired EXTERNAL port from the available pool
    host: str = "0.0.0.0"  # Host for the internal undreamai_server
    ngl: int = 30
    template: str = "chatml"
    custom_params: str = ""

class UpdateAllowlistRequest(BaseModel):
    service: str
    content: str

# Helper function to get log file path for an instance (uses internal port)
def get_llm_log_file(internal_port: int) -> str:
    return f"/app/server_logs_{internal_port}.txt"

# Helper to find internal port from external port
def get_internal_port(external_port: int) -> Optional[int]:
    return PORT_MAPPING.get(external_port)

# Helper to find external port from internal port
def get_external_port(internal_port: int) -> Optional[int]:
    for ext_port, int_port in PORT_MAPPING.items():
        if int_port == internal_port:
            return ext_port
    return None

# -----------------------
# LLM Server Endpoints
# -----------------------
@app.post("/start-llm-instance/")
async def start_llm_instance(config: LLMInstanceConfig):
    global llm_instances
    external_port = config.external_port

    # Validate external port
    if external_port not in AVAILABLE_EXTERNAL_PORTS:
        raise HTTPException(status_code=400, detail=f"Invalid external port specified: {external_port}. Available: {AVAILABLE_EXTERNAL_PORTS}")

    internal_port = get_internal_port(external_port)
    if internal_port is None:  # Should not happen if validation above passes
        raise HTTPException(status_code=500, detail="Internal error: Port mapping failed.")

    # Check if internal port is already in use
    if internal_port in llm_instances and llm_instances[internal_port]['process'].poll() is None:
        raise HTTPException(status_code=400, detail=f"Port {external_port} (internal: {internal_port}) is already in use.")

    log_file = get_llm_log_file(internal_port)
    with open(log_file, "w") as log:
        log.write("")

    binary_path = "/app/server/linux-cuda-cu12.2.0/undreamai_server"
    if not os.path.exists(binary_path):
        raise HTTPException(status_code=500, detail="undreamai_server binary not found")

    model_path = f"/models/llm/{config.model}"
    if not os.path.exists(model_path):
        found_model = False
        for ext in ['.gguf', '.bin']:
            potential_path = f"{model_path}{ext}"
            if os.path.exists(potential_path):
                model_path = potential_path
                found_model = True
                break
        if not found_model:
            models_dir = "/models/llm"
            if os.path.isdir(models_dir):
                for fname in os.listdir(models_dir):
                    if fname.startswith(config.model):
                        model_path = os.path.join(models_dir, fname)
                        found_model = True
                        logger.info(f"Found model matching prefix: {model_path}")
                        break
            if not found_model:
                raise HTTPException(status_code=404, detail=f"Model file not found: {config.model} or path {model_path}")

    command = [
        binary_path,
        "-m", model_path,
        "--host", config.host,  # undreamai listens on internal host
        "--port", str(internal_port),  # undreamai listens on internal port
        "-ngl", str(config.ngl),
        "--template", config.template
    ]

    custom_params_list = shlex.split(config.custom_params)
    if custom_params_list:
        command.extend(custom_params_list)

    logger.info(f"➡️ Starting LLM instance on external port {external_port} (internal: {internal_port}): {' '.join(command)}")

    try:
        with open(log_file, "a") as log:
            process = subprocess.Popen(
                command,
                stdout=log,
                stderr=log,
                cwd="/app",
                preexec_fn=os.setpgrp
            )

        # Store process and config, using internal_port as key
        llm_instances[internal_port] = {
            'process': process,
            'config': config.dict(),  # Store original config including external_port
            'log_file': log_file,
            'external_port': external_port  # Store external port for reference
        }
        logger.info(f"LLM instance started successfully on internal port {internal_port} (external: {external_port}) with PID {process.pid}")
        return {"status": f"LLM instance started successfully on external port {external_port}", "log_file": log_file, "internal_port": internal_port}
    except Exception as e:
        logger.error(f"Failed to start LLM instance for external port {external_port}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start LLM instance: {e}")

@app.post("/stop-llm-instance/")
async def stop_llm_instance(data: dict):
    global llm_instances
    external_port = data.get("external_port")  # Expect external port from frontend

    if external_port is None:
        raise HTTPException(status_code=400, detail="Missing 'external_port' in request.")

    internal_port = get_internal_port(external_port)
    if internal_port is None or internal_port not in llm_instances:
        raise HTTPException(status_code=404, detail=f"Instance on external port {external_port} not found.")

    if llm_instances[internal_port]['process'].poll() is not None:
        logger.warning(f"Stop request for already terminated instance on external port {external_port} (internal: {internal_port}). Cleaning up.")
        del llm_instances[internal_port]
        return {"status": f"LLM instance on external port {external_port} was already stopped."}

    instance_info = llm_instances[internal_port]
    process = instance_info['process']
    log_file = instance_info['log_file']

    logger.info(f"Attempting to stop LLM instance on external port {external_port} (internal: {internal_port}, PID: {process.pid})")

    try:
        pgid = os.getpgid(process.pid)
        logger.info(f"Sending SIGTERM to process group {pgid} for instance on internal port {internal_port}")
        os.killpg(pgid, signal.SIGTERM)

        try:
            process.wait(timeout=5)
            logger.info(f"LLM instance on internal port {internal_port} (PGID: {pgid}) terminated gracefully.")
        except subprocess.TimeoutExpired:
            logger.warning(f"LLM instance on internal port {internal_port} (PGID: {pgid}) did not terminate gracefully after 5s. Sending SIGKILL.")
            os.killpg(pgid, signal.SIGKILL)
            process.wait(timeout=5)
            logger.info(f"Sent SIGKILL to process group {pgid}")

        # Clean up using internal_port key
        del llm_instances[internal_port]
        logger.info(f"Removed instance entry for internal port {internal_port} (external: {external_port})")

        try:
            with open(log_file, "w") as log:
                log.write("")
            logger.info(f"Cleared log file: {log_file}")
        except Exception as log_err:
            logger.error(f"Error clearing log file {log_file}: {log_err}")

        return {"status": f"LLM instance on external port {external_port} stopped successfully"}

    except ProcessLookupError:
        logger.warning(f"Process group for instance on internal port {internal_port} not found. Already terminated?")
        if internal_port in llm_instances:
            del llm_instances[internal_port]
        return {"status": f"LLM instance on external port {external_port} was already stopped."}
    except Exception as e:
        logger.error(f"Failed to stop LLM instance on external port {external_port}: {e}")
        if internal_port in llm_instances:
            if llm_instances[internal_port]['process'].poll() is not None:
                del llm_instances[internal_port]
        raise HTTPException(status_code=500, detail=f"Failed to stop LLM instance {external_port}: {e}")

@app.get("/list-llm-instances/")
async def list_llm_instances():
    global llm_instances
    running_instances_info = {}
    ports_to_remove = []

    for internal_port, info in llm_instances.items():
        process = info['process']
        external_port = info.get('external_port', get_external_port(internal_port))  # Get external port

        if process.poll() is None:
            if external_port is not None:
                running_instances_info[external_port] = {  # Keyed by external port for frontend
                    "config": info['config'],
                    "log_file": info['log_file'],
                    "status": "running",
                    "pid": process.pid,
                    "internal_port": internal_port  # Include internal port for reference
                }
            else:
                logger.error(f"Could not find external port mapping for running internal port {internal_port}")
        else:
            logger.warning(f"Found terminated instance for internal port {internal_port}. Cleaning up.")
            ports_to_remove.append(internal_port)

    for internal_port in ports_to_remove:
        if internal_port in llm_instances:
            del llm_instances[internal_port]

    return running_instances_info

# -----------------------
# Server Stats Endpoint
# -----------------------
@app.get("/stats/")
async def get_stats():
    global llm_instances, stable_diffusion_process

    try:
        gpu_usage = 0
        nvidia_smi_exists = subprocess.run(
            ["which", "nvidia-smi"], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        ).returncode == 0
        
        if nvidia_smi_exists:
            nvidia_smi_output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                text=True, 
                stderr=subprocess.PIPE
            ).strip()
            
            if nvidia_smi_output:
                gpu_values = [float(x.strip()) for x in nvidia_smi_output.split('\n') if x.strip()]
                if gpu_values:
                    gpu_usage = int(max(gpu_values))
    except (subprocess.SubprocessError, ValueError, FileNotFoundError, PermissionError) as e:
        print(f"Error getting GPU stats: {e}")
        gpu_usage = 0

    llm_instance_statuses = {}
    ports_to_remove = []
    for internal_port, info in llm_instances.items():
        external_port = info.get('external_port', get_external_port(internal_port))
        if external_port is None:
            logger.error(f"Stats: Could not find external port for internal port {internal_port}")
            continue

        if info['process'].poll() is None:
            llm_instance_statuses[external_port] = "running"
        else:
            llm_instance_statuses[external_port] = "stopped"
            ports_to_remove.append(internal_port)

    for internal_port in ports_to_remove:
        if internal_port in llm_instances:
            logger.info(f"Cleaning up stopped instance from stats check: internal port {internal_port}")
            del llm_instances[internal_port]

    return {
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent,
        "gpu": gpu_usage,
        "llm_instances": llm_instance_statuses,
        "sd_running": stable_diffusion_process and stable_diffusion_process.poll() is None
    }

# -----------------------
# Log Viewing Endpoint
# -----------------------
@app.get("/llm-logs/")
async def get_llm_logs(external_port: int):
    internal_port = get_internal_port(external_port)

    if internal_port is None:
        raise HTTPException(status_code=400, detail=f"Invalid or unmapped external port: {external_port}")

    log_file = get_llm_log_file(internal_port)

    instance_exists = internal_port in llm_instances
    log_file_exists = os.path.exists(log_file)

    if not instance_exists and not log_file_exists:
        raise HTTPException(status_code=404, detail=f"No running instance or log file found for external port {external_port} (internal: {internal_port})")

    try:
        with open(log_file, "r") as log_file_data:
            return PlainTextResponse(log_file_data.read())
    except FileNotFoundError:
        if instance_exists:
            logger.warning(f"Log file {log_file} not found for existing instance (internal port {internal_port})")
            return PlainTextResponse("")
        else:
            raise HTTPException(status_code=404, detail=f"Log file not found: {log_file}")
    except Exception as e:
        logger.error(f"Error reading log file {log_file}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read logs for instance on external port {external_port}")

# -----------------------
# List Models
# -----------------------
@app.get("/list-models/")
async def list_models():
    models_dir = "/models/llm"
    if not os.path.isdir(models_dir):
        raise HTTPException(status_code=404, detail="LLM models directory not found")
    models = os.listdir(models_dir)
    return {"models": models}

@app.get("/list-sd-models/")
async def list_sd_models():
    models_dir = "/models/stable-diffusion"
    if not os.path.isdir(models_dir):
        raise HTTPException(status_code=404, detail="Stable Diffusion models directory not found")
    models = os.listdir(models_dir)
    return {"models": models}

# -----------------------
# Stable Diffusion Endpoints
# -----------------------
@app.get("/sd-status/")
async def get_sd_status():
    global stable_diffusion_process
    running = stable_diffusion_process is not None and stable_diffusion_process.poll() is None
    return {"running": running}

@app.post("/start-stable-diffusion/")
async def start_stable_diffusion():
    global stable_diffusion_process
    
    if stable_diffusion_process and stable_diffusion_process.poll() is None:
        raise HTTPException(status_code=400, detail="Stable Diffusion is already running.")
    
    with open(sd_log_file, "w") as log:
        log.write("")
    
    launcher_path = "/app/stable-diffusion-webui/sd_launcher.sh"
    
    if not os.path.exists(launcher_path):
        try:
            with open(launcher_path, "w") as f:
                f.write('#!/bin/bash\n')
                f.write('cd /app/stable-diffusion-webui\n')
                f.write('export PYTHONPATH=/app/stable-diffusion-webui\n')
                f.write('# Create symbolic links to models in the mounted volume\n')
                f.write('if [ -d "/models/stable-diffusion" ]; then\n')
                f.write('  for file in $(find /models/stable-diffusion -type f \\( -name "*.safetensors" -o -name "*.ckpt" \\)); do\n')
                f.write('    ln -sf "$file" /app/stable-diffusion-webui/models/Stable-diffusion/\n')
                f.write('    echo "Linked model: $file"\n')
                f.write('  done\n')
                f.write('fi\n')
                f.write('python3 launch.py --skip-torch-cuda-test --api --xformers --cors-allow-origins "*" "$@"\n')
            os.chmod(launcher_path, 0o755)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create Stable Diffusion launcher: {str(e)}")
    
    if not os.path.exists(launcher_path):
        raise HTTPException(status_code=500, detail="Stable Diffusion launcher not found")
    
    command = [
        launcher_path,
        "--listen",
        "--port", "7861",
        "--allow-code",
        "--no-download-sd-model",
        "--api",
        "--xformers",
        "--cors-allow-origins", "*"
    ]
    
    print(f"➡️ Starting Stable Diffusion: {' '.join(command)}")
    
    try:
        with open(sd_log_file, "w") as log:
            stable_diffusion_process = subprocess.Popen(
                command,
                stdout=log,
                stderr=log,
                cwd="/app/stable-diffusion-webui",
                preexec_fn=os.setpgrp
            )
        
        time.sleep(2)
        
        if stable_diffusion_process.poll() is not None:
            raise HTTPException(status_code=500, detail="Failed to start Stable Diffusion. Check logs for details.")
        
        return {"status": "Stable Diffusion started successfully", "log_file": sd_log_file}
    
    except Exception as e:
        if stable_diffusion_process:
            try:
                stable_diffusion_process.terminate()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error starting Stable Diffusion: {str(e)}")

@app.post("/stop-stable-diffusion/")
async def stop_stable_diffusion():
    global stable_diffusion_process

    if not stable_diffusion_process or stable_diffusion_process.poll() is not None:
        raise HTTPException(status_code=400, detail="Stable Diffusion is not currently running.")

    try:
        pid = stable_diffusion_process.pid
        pgid = os.getpgid(pid)
        logger.info(f"Attempting to stop Stable Diffusion process group with PGID: {pgid}")

        os.killpg(pgid, signal.SIGTERM)
        logger.info(f"Sent SIGTERM to process group {pgid}")

        stopped = False
        for _ in range(10):
            if stable_diffusion_process.poll() is not None:
                logger.info(f"Process group {pgid} terminated gracefully.")
                stopped = True
                break
            time.sleep(1)

        if not stopped:
            logger.warning(f"Process group {pgid} did not terminate gracefully. Sending SIGKILL.")
            try:
                os.killpg(pgid, signal.SIGKILL)
                stable_diffusion_process.wait(timeout=5)
                logger.info(f"Sent SIGKILL to process group {pgid}")
            except ProcessLookupError:
                logger.info(f"Process group {pgid} already terminated after SIGKILL attempt.")
            except Exception as kill_err:
                logger.error(f"Error sending SIGKILL to process group {pgid}: {kill_err}")

        stable_diffusion_process = None
        logger.info("Stable Diffusion process reference cleared.")

        try:
            with open(sd_log_file, "w") as log:
                log.write("")
            logger.info(f"Cleared Stable Diffusion log file: {sd_log_file}")
        except Exception as log_err:
            logger.error(f"Error clearing Stable Diffusion log file: {log_err}")

        return {"status": "Stable Diffusion stopped successfully"}

    except ProcessLookupError:
        logger.warning(f"Process group {pgid} not found. Already terminated?")
        stable_diffusion_process = None
        return {"status": "Stable Diffusion process was already stopped."}
    except Exception as e:
        logger.error(f"Failed to stop Stable Diffusion: {e}")
        if stable_diffusion_process and stable_diffusion_process.poll() is None:
            logger.warning("Error occurred, but process might still be running. Attempting final kill.")
            try:
                pgid = os.getpgid(stable_diffusion_process.pid)
                os.killpg(pgid, signal.SIGKILL)
            except Exception as final_kill_err:
                logger.error(f"Final kill attempt failed: {final_kill_err}")
        stable_diffusion_process = None
        raise HTTPException(status_code=500, detail=f"Failed to stop Stable Diffusion: {str(e)}")

@app.get("/sd-logs/")
async def get_sd_logs():
    try:
        with open(sd_log_file, "r") as log_file_data:
            return log_file_data.read()
    except FileNotFoundError:
        return ""
    except Exception as e:
        logger.error(f"Error reading SD logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to read Stable Diffusion logs")

@app.get("/check-sd-webui/")
async def check_sd_webui():
    try:
        response = requests.get("http://localhost:7861/", timeout=5)
        return {"available": response.status_code == 200}
    except requests.RequestException:
        return {"available": False}

# -----------------------
# Nginx IP Allowlist Management
# -----------------------
@app.get("/get-allowed-ips/", response_class=PlainTextResponse)
async def get_allowed_ips(service: str = "frontend"):
    if service not in ALLOWLIST_FILES:
        raise HTTPException(status_code=400, detail=f"Invalid service specified. Must be one of {list(ALLOWLIST_FILES.keys())}")

    nginx_allowlist_file = ALLOWLIST_FILES[service]

    try:
        if not os.path.exists(nginx_allowlist_file):
            logger.warning(f"Allowlist file not found: {nginx_allowlist_file}")
            return f"# Allowlist file for '{service}' not found. Enter IPs/CIDRs below.\n# Example: 192.168.1.1\n# Example: 0.0.0.0/0 (Allow all)"
        with open(nginx_allowlist_file, "r") as f:
            lines = f.readlines()
            processed_lines = []
            for line in lines:
                stripped_line = line.strip()
                if stripped_line.endswith(" 1;") or stripped_line.endswith(" 0;"):
                    processed_lines.append(stripped_line[:-3].strip())
                elif stripped_line and not stripped_line.startswith("#"):
                    processed_lines.append(stripped_line)
                elif stripped_line.startswith("#"):
                    processed_lines.append(stripped_line)

            return "\n".join(processed_lines)
    except Exception as e:
        logger.error(f"Error reading allowlist file ({nginx_allowlist_file}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read allowlist file for {service}: {e}")

@app.post("/update-allowed-ips/")
async def update_allowed_ips(request_data: UpdateAllowlistRequest):
    service = request_data.service
    content = request_data.content

    if service not in ALLOWLIST_FILES:
        raise HTTPException(status_code=400, detail=f"Invalid service specified. Must be one of {list(ALLOWLIST_FILES.keys())}")

    nginx_allowlist_file = ALLOWLIST_FILES[service]

    if content is None:
        raise HTTPException(status_code=400, detail="Missing 'content' in request body.")

    try:
        lines = content.splitlines()
        processed_lines = []
        for line in lines:
            stripped_line = line.strip()
            if stripped_line and not stripped_line.startswith("#"):
                if not (stripped_line.endswith(" 1;") or stripped_line.endswith(" 0;")):
                    processed_lines.append(f"{stripped_line} 1;")
                else:
                    processed_lines.append(stripped_line)
            elif stripped_line:
                processed_lines.append(stripped_line)

        with open(nginx_allowlist_file, "w") as f:
            f.write("\n".join(processed_lines) + "\n")
        logger.info(f"Successfully updated {nginx_allowlist_file}")
        return {"status": f"Allowlist for {service} updated successfully. Restart Nginx to apply changes."}
    except Exception as e:
        logger.error(f"Error writing allowlist file ({nginx_allowlist_file}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to write allowlist file for {service}: {e}")

@app.post("/restart-nginx/")
async def restart_nginx():
    try:
        command = ["nginx", "-s", "reload"]
        logger.info(f"Executing Nginx reload command: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=False)

        if result.returncode == 0:
            logger.info("Nginx reloaded successfully.")
            return {"status": "Nginx reloaded successfully."}
        else:
            error_message = f"Nginx reload failed. Return code: {result.returncode}. Error: {result.stderr or result.stdout}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
    except FileNotFoundError:
        logger.error("Nginx command not found.")
        raise HTTPException(status_code=500, detail="Nginx command not found. Is Nginx installed and in PATH?")
    except Exception as e:
        logger.error(f"Error restarting Nginx: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to restart Nginx: {e}")
