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
stable_diffusion_process = None  
log_file = "/app/server_logs.txt"
sd_log_file = "/app/sd_logs.txt"  
nginx_allowlist_file = "/etc/nginx/allowed_ips_frontend.conf" 

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
        "--port", str(params.get("port", 1338)), # Changed internal port to 1338
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
        "--port", "7861",  # Changed internal port to 7861
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
        # Check the internal port 7861
        response = requests.get("http://localhost:7861/", timeout=5)
        return {"available": response.status_code == 200}
    except requests.RequestException:
        return {"available": False}

# -----------------------
# Nginx IP Allowlist Management
# -----------------------
@app.get("/get-allowed-ips/", response_class=PlainTextResponse)
async def get_allowed_ips():
    """Reads and returns the content of the Nginx IP allowlist file, formatted for the UI."""
    try:
        # Check if file exists before reading
        if not os.path.exists(nginx_allowlist_file):
            logger.warning(f"Allowlist file not found: {nginx_allowlist_file}")
            # Return a default or empty state if the file doesn't exist
            return "# Allowlist file not found. Enter IPs/CIDRs below.\n# Example: 192.168.1.1\n# Example: 0.0.0.0/0 (Allow all)"
        with open(nginx_allowlist_file, "r") as f:
            lines = f.readlines()
            # Process lines to remove the " 1;" suffix for UI display
            processed_lines = []
            for line in lines:
                stripped_line = line.strip()
                if stripped_line.endswith(" 1;"):
                    processed_lines.append(stripped_line[:-3].strip())
                elif stripped_line and not stripped_line.startswith("#"): # Keep non-empty lines that don't end with " 1;" (e.g., comments)
                    processed_lines.append(stripped_line)
                elif stripped_line.startswith("#"): # Keep comments as is
                    processed_lines.append(stripped_line)

            return "\n".join(processed_lines)
    except Exception as e:
        logger.error(f"Error reading allowlist file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read allowlist file: {e}")

@app.post("/update-allowed-ips/")
async def update_allowed_ips(request: Request):
    """Updates the Nginx IP allowlist file, adding ' 1;' to each entry."""
    try:
        data = await request.json()
        content = data.get("content")
        if content is None:
            raise HTTPException(status_code=400, detail="Missing 'content' in request body.")

        # Basic validation
        if not isinstance(content, str):
            raise HTTPException(status_code=400, detail="'content' must be a string.")

        # Process lines to add " 1;" suffix before writing
        lines = content.splitlines()
        processed_lines = []
        for line in lines:
            stripped_line = line.strip()
            if stripped_line and not stripped_line.startswith("#"): # Only add to non-empty, non-comment lines
                processed_lines.append(f"{stripped_line} 1;")
            elif stripped_line: # Keep comment lines
                processed_lines.append(stripped_line)

        with open(nginx_allowlist_file, "w") as f:
            f.write("\n".join(processed_lines) + "\n") # Add trailing newline
        logger.info(f"Successfully updated {nginx_allowlist_file}")
        return {"status": "Allowlist updated successfully. Restart Nginx to apply changes."}
    except HTTPException:
        raise  # Re-raise validation errors
    except Exception as e:
        logger.error(f"Error writing allowlist file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to write allowlist file: {e}")

@app.post("/restart-nginx/")
async def restart_nginx():
    """Restarts the Nginx server to apply configuration changes."""
    try:
        # Use 'nginx -s reload' for graceful restart/reload
        command = ["nginx", "-s", "reload"]
        logger.info(f"Executing Nginx reload command: {' '.join(command)}")
        # Using check=False to handle non-zero exit codes manually
        result = subprocess.run(command, capture_output=True, text=True, check=False)

        if result.returncode == 0:
            logger.info("Nginx reloaded successfully.")
            return {"status": "Nginx reloaded successfully."}
        else:
            # Log the error output from nginx command
            error_message = f"Nginx reload failed. Return code: {result.returncode}. Error: {result.stderr or result.stdout}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
    except FileNotFoundError:
        logger.error("Nginx command not found.")
        raise HTTPException(status_code=500, detail="Nginx command not found. Is Nginx installed and in PATH?")
    except Exception as e:
        logger.error(f"Error restarting Nginx: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to restart Nginx: {e}")
