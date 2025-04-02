import threading
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import psutil
import os
import requests
import logging

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

server_process = None
stable_diffusion_process = None  # Process for Stable Diffusion
log_file = "/app/server_logs.txt"
sd_log_file = "/app/sd_logs.txt"  # Logs for Stable Diffusion

# Initialize allowlist from environment variable or default to "0.0.0.0"
allowlist = os.environ.get("ALLOWLIST", "0.0.0.0")
# Initialize blocklist
blocklist = os.environ.get("BLOCKLIST", "")

# -----------------------
# Server Endpoints
# -----------------------
@app.post("/start-server/")
async def start_server(request: Request):
    global server_process

    params = await request.json()
    custom_params = params.get("custom_params", "").strip()

    if server_process and server_process.poll() is None:
        raise HTTPException(status_code=400, detail="Server is already running.")

    # Clear logs before starting the server
    with open(log_file, "w") as log:
        log.write("")  

    binary_path = "/app/server/linux-cuda-cu12.2.0/undreamai_server"

    if not os.path.exists(binary_path):
        raise HTTPException(status_code=500, detail="undreamai_server binary not found")

    model_path = f"/models/llm/{params.get('model', 'model')}"

    command = [
        binary_path,
        "-m", model_path,
        "--host", params.get("host", "0.0.0.0"),
        "--port", str(params.get("port", 1337)),
        "-ngl", str(params.get("ngl", 30)),
        "--template", params.get("template", "chatml")
    ]

    # Append custom params if provided
    if custom_params:
        command.extend(custom_params.split())

    print(f"➡️ Starting command: {' '.join(command)}")

    with open(log_file, "w") as log:
        server_process = subprocess.Popen(
            command,
            stdout=log,
            stderr=log,
            cwd="/app",
            preexec_fn=os.setpgrp
        )

    return {"status": "Server started successfully", "log_file": log_file}

@app.post("/stop-server/")
async def stop_server():
    global server_process

    if not server_process or server_process.poll() is not None:
        raise HTTPException(status_code=400, detail="Server is not currently running.")

    try:
        server_process.terminate()
        server_process.wait()  # Wait for the process to exit
        server_process = None

        # Clear logs when the server is stopped
        with open(log_file, "w") as log:
            log.write("")

        return {"status": "Server stopped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop server: {e}")

# -----------------------
# Model Download Endpoint
# -----------------------
@app.post("/download-model/")
async def download_model(data: dict):
    model_url = data.get("url")
    filename = data.get("filename", "model")  # Use custom filename if provided
    model_type = data.get("type", "llm")  # Either "llm" or "sd"

    if not model_url:
        raise HTTPException(status_code=400, detail="Model URL is required.")

    # Determine the correct directory and extension based on model type
    if model_type.lower() == "sd":
        # For Stable Diffusion models
        model_dir = "/models/stable-diffusion"
        extension = ".safetensors"
    else:
        # For LLM models
        model_dir = "/models/llm"
        extension = ".gguf"

    # Make sure the directory exists
    os.makedirs(model_dir, exist_ok=True)

    # Save model with dynamic name
    model_path = f"{model_dir}/{filename}{extension}"
    response = requests.get(model_url)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to download model.")

    with open(model_path, 'wb') as file:
        file.write(response.content)
    
    return {"status": f"Model downloaded successfully as {filename}{extension}"}

# -----------------------
# Server Stats Endpoint
# -----------------------
@app.get("/stats/")
async def get_stats():
    global server_process, stable_diffusion_process
    
    # Get GPU usage using nvidia-smi
    try:
        gpu_usage = 0
        
        # First check if nvidia-smi is available
        nvidia_smi_exists = subprocess.run(
            ["which", "nvidia-smi"], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        ).returncode == 0
        
        if nvidia_smi_exists:
            # Get GPU utilization - this works with multiple GPUs
            nvidia_smi_output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                text=True, 
                stderr=subprocess.PIPE
            ).strip()
            
            # Parse the output - if multiple GPUs, take the max utilization
            if nvidia_smi_output:
                gpu_values = [float(x.strip()) for x in nvidia_smi_output.split('\n') if x.strip()]
                if gpu_values:
                    gpu_usage = int(max(gpu_values))  # Use the highest GPU usage if multiple GPUs
    except (subprocess.SubprocessError, ValueError, FileNotFoundError, PermissionError) as e:
        print(f"Error getting GPU stats: {e}")
        gpu_usage = 0
    
    return {
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent,
        "gpu": gpu_usage,
        "server_running": server_process and server_process.poll() is None,
        "sd_running": stable_diffusion_process and stable_diffusion_process.poll() is None
    }

# -----------------------
# Log Viewing Endpoint
# -----------------------
@app.get("/logs/")
async def get_logs():
    try:
        with open(log_file, "r") as log_file_data:
            return log_file_data.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Log file not found")

# -----------------------
# List Models
# -----------------------
@app.get("/list-models/")
async def list_models():
    models_dir = "/models/llm"
    if not os.path.isdir(models_dir):
        raise HTTPException(status_code=404, detail="LLM models directory not found")
    models = os.listdir(models_dir)  # List all files without filtering
    return {"models": models}

@app.get("/list-sd-models/")
async def list_sd_models():
    models_dir = "/models/stable-diffusion"
    if not os.path.isdir(models_dir):
        raise HTTPException(status_code=404, detail="Stable Diffusion models directory not found")
    models = os.listdir(models_dir)  # List all files without filtering
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
    
    # Clear logs before starting
    with open(sd_log_file, "w") as log:
        log.write("")
    
    # Path to our custom Stable Diffusion launcher script
    launcher_path = "/app/stable-diffusion-webui/sd_launcher.sh"
    
    if not os.path.exists(launcher_path):
        # Try to create the launcher if it doesn't exist
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
    
    # Command to start Stable Diffusion with common parameters
    # Using --listen to make it accessible from outside the container
    command = [
        launcher_path,
        "--listen",
        "--port", "7860",
        "--allow-code",
        "--no-download-sd-model",
        "--api",
        "--xformers",
        "--cors-allow-origins", "*"  # Allow CORS for Unity access
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
        
        # Wait a moment to ensure the process started
        time.sleep(2)
        
        if stable_diffusion_process.poll() is not None:
            # If process exited already, there was an error
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
        # Try graceful termination
        stable_diffusion_process.terminate()
        
        # Give it some time to shut down gracefully
        for _ in range(10):  # Wait up to 10 seconds
            if stable_diffusion_process.poll() is not None:
                break
            time.sleep(1)
        
        # If still running, force kill
        if stable_diffusion_process.poll() is None:
            stable_diffusion_process.kill()
            stable_diffusion_process.wait()
        
        stable_diffusion_process = None
        
        return {"status": "Stable Diffusion stopped successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop Stable Diffusion: {str(e)}")

@app.get("/sd-logs/")
async def get_sd_logs():
    try:
        with open(sd_log_file, "r") as log_file_data:
            return log_file_data.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Stable Diffusion log file not found")

# -----------------------
# Stable Diffusion Status Check
# -----------------------
@app.get("/check-sd-webui/")
async def check_sd_webui():
    """Check if Stable Diffusion Web UI is responsive."""
    try:
        response = requests.get("http://localhost:7860/", timeout=5)
        return {"available": response.status_code == 200}
    except requests.RequestException:
        return {"available": False}

# -----------------------
# UFW Firewall Endpoints
# -----------------------
@app.get("/ufw/status/")
async def get_ufw_status():
    try:
        # Check if UFW is installed
        which_result = subprocess.run(["which", "ufw"], capture_output=True, text=True)
        if which_result.returncode != 0:
            return {"error": "UFW is not installed on this system", "status": "not_installed"}
        
        # Just use sudo directly
        status_result = subprocess.run(["sudo", "ufw", "status"], capture_output=True, text=True)
        status_output = status_result.stdout
        
        # Parse the status output
        is_active = "Status: active" in status_output
        
        # Parse rules if active
        rules = []
        if is_active:
            lines = status_output.strip().split('\n')
            for line in lines[4:]:  # Skip header lines
                if line.strip():
                    parts = [p for p in line.split() if p]
                    if len(parts) >= 3:
                        rule = {
                            "action": parts[0],
                            "to": parts[1],
                            "port": parts[2] if "(" not in parts[2] else parts[2].split("(")[0],
                            "from": parts[3] if len(parts) > 3 else "Anywhere"
                        }
                        rules.append(rule)
        
        return {
            "status": "active" if is_active else "inactive",
            "rules": rules,
            "raw_output": status_output
        }
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.post("/ufw/enable/")
async def enable_ufw():
    try:
        # Check if UFW is installed
        which_result = subprocess.run(["which", "ufw"], capture_output=True, text=True)
        if which_result.returncode != 0:
            raise HTTPException(status_code=400, detail="UFW is not installed on this system")
        
        # Just use sudo directly
        result = subprocess.run(["sudo", "ufw", "--force", "enable"], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to enable UFW: {result.stderr}")
        
        return {"status": "UFW enabled successfully", "output": result.stdout}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/ufw/disable/")
async def disable_ufw():
    try:
        # Check if UFW is installed
        which_result = subprocess.run(["which", "ufw"], capture_output=True, text=True)
        if which_result.returncode != 0:
            raise HTTPException(status_code=400, detail="UFW is not installed on this system")
        
        # Just use sudo directly
        result = subprocess.run(["sudo", "ufw", "--force", "disable"], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to disable UFW: {result.stderr}")
        
        return {"status": "UFW disabled successfully", "output": result.stdout}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/ufw/add-rule/")
async def add_ufw_rule(data: dict):
    try:
        # Check if UFW is installed
        which_result = subprocess.run(["which", "ufw"], capture_output=True, text=True)
        if which_result.returncode != 0:
            raise HTTPException(status_code=400, detail="UFW is not installed on this system")
        
        # Get rule parameters
        action = data.get("action", "allow")
        from_ip = data.get("from_ip")
        to_port = data.get("to_port")
        
        if not from_ip or not to_port:
            raise HTTPException(status_code=400, detail="IP address and port are required")
        
        # Validate IP address format
        try:
            octets = from_ip.split(".")
            if len(octets) != 4:
                raise ValueError()
            for octet in octets:
                value = int(octet)
                if value < 0 or value > 255:
                    raise ValueError()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        # Build the UFW command with sudo
        cmd = ["sudo", "ufw", action, "from", from_ip, "to", "any", "port", to_port]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to add UFW rule: {result.stderr}")
        
        return {"status": "Rule added successfully", "output": result.stdout}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/ufw/delete-rule/")
async def delete_ufw_rule(data: dict):
    try:
        # Check if UFW is installed
        which_result = subprocess.run(["which", "ufw"], capture_output=True, text=True)
        if which_result.returncode != 0:
            raise HTTPException(status_code=400, detail="UFW is not installed on this system")
        
        rule_number = data.get("rule_number")
        
        if not rule_number:
            raise HTTPException(status_code=400, detail="Rule number is required")
        
        # Use sudo directly
        result = subprocess.run(["sudo", "ufw", "delete", str(rule_number)], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to delete rule: {result.stderr}")
        
        return {"status": "Rule deleted successfully", "output": result.stdout}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}") 

# IP Access Control endpoints
@app.get("/allowlist/")
async def get_allowlist():
    return {"allowlist": allowlist, "blocklist": blocklist}

@app.post("/update-allowlist/")
async def update_allowlist(data: dict):
    global allowlist
    
    new_allowlist = data.get("allowlist")
    if not new_allowlist:
        raise HTTPException(status_code=400, detail="New allowlist must be provided")
    
    # Validate IP format (basic validation)
    try:
        ips = new_allowlist.split(",")
        for ip in ips:
            ip = ip.strip()
            if ip == "0.0.0.0":  # Special case for "all IPs"
                continue
            octets = ip.split(".")
            if len(octets) != 4:
                raise ValueError("Invalid IP format")
            for octet in octets:
                value = int(octet)
                if value < 0 or value > 255:
                    raise ValueError("Invalid IP value")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid IP format: {str(e)}")
    
    # Update the allowlist
    allowlist = new_allowlist
    
    # In a real-world scenario, we'd update some configuration file or restart services
    # Here we just update the in-memory variable
    
    return {"status": "Allowlist updated successfully", "allowlist": allowlist}

@app.post("/update-blocklist/")
async def update_blocklist(data: dict):
    global blocklist
    
    new_blocklist = data.get("blocklist")
    if new_blocklist is None:
        raise HTTPException(status_code=400, detail="New blocklist must be provided")
    
    # 0.0.0.0 is a special address that shouldn't be in the blocklist
    if "0.0.0.0" in new_blocklist:
        raise HTTPException(status_code=400, detail="Cannot block 0.0.0.0 as it's a special address")
    
    # Validate IP format (basic validation)
    if new_blocklist:  # Skip validation if empty string
        try:
            ips = new_blocklist.split(",")
            for ip in ips:
                ip = ip.strip()
                octets = ip.split(".")
                if len(octets) != 4:
                    raise ValueError("Invalid IP format")
                for octet in octets:
                    value = int(octet)
                    if value < 0 or value > 255:
                        raise ValueError("Invalid IP value")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid IP format: {str(e)}")
    
    # Update the blocklist
    blocklist = new_blocklist
    
    # In a real-world scenario, you'd apply these rules to the actual firewall
    # Here we just log that the update happened
    print(f"Updated blocklist: {blocklist}")
    
    return {"status": "Blocklist updated successfully", "blocklist": blocklist}
