# ==================
# Base Image
# ==================
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base

WORKDIR /app

# Install system dependencies, Node.js, and Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 libgomp1 openssh-server sudo curl unzip wget vim nvtop \
    python3 python3-pip python3-venv python3-dev git ffmpeg libsm6 libxext6 libgl1 ufw \
    nginx && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python build tools
RUN pip3 install --upgrade pip setuptools wheel
# Install Stable Diffusion dependencies
RUN pip3 install torch torchvision torchaudio numpy pillow

# ------------------
# Install backend dependencies
# ------------------
COPY backend/requirements.txt /app/backend/requirements.txt
WORKDIR /app/backend
RUN pip3 install -r requirements.txt

# ------------------
# Install frontend dependencies
# ------------------
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# ------------------
# Prepare server binaries and directories
# ------------------
WORKDIR /app
RUN mkdir -p /app/server

ARG VERSION=v1.1.10
COPY binaries/* /app/

RUN unzip undreamai-${VERSION}-llamacpp.zip -d /app/server/ && \
    unzip undreamai-${VERSION}-server.zip -d /app/server/ && \
    rm undreamai-${VERSION}-llamacpp.zip undreamai-${VERSION}-server.zip

# Create models directories
RUN mkdir -p /models/stable-diffusion /models/llm

# ------------------
# Clone Stable Diffusion WebUI and configure it
# ------------------
RUN git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git /app/stable-diffusion-webui

# Create required model directories
RUN mkdir -p /app/stable-diffusion-webui/models/VAE \
    /app/stable-diffusion-webui/models/Lora \
    /app/stable-diffusion-webui/models/Stable-diffusion \
    /app/stable-diffusion-webui/models/ControlNet \
    /app/stable-diffusion-webui/models/ESRGAN \
    /app/stable-diffusion-webui/models/hypernetworks

WORKDIR /app/stable-diffusion-webui
RUN cat > config.yaml <<'EOL'
commandline_args:
  - --listen
  - --port
  - "7860"
  - --allow-code
  - --no-download-sd-model
  - --api
  - --xformers
  - --cors-allow-origins
  - "*"
EOL

# Create a custom launcher script
RUN echo '#!/bin/bash' > /app/stable-diffusion-webui/sd_launcher.sh && \
    echo 'cd /app/stable-diffusion-webui' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo 'export PYTHONPATH=/app/stable-diffusion-webui' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '# Create symbolic links to models in the mounted volume' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo 'if [ -d "/models/stable-diffusion" ]; then' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '  for file in /models/stable-diffusion/*.safetensors /models/stable-diffusion/*.ckpt; do' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '    if [ -f "$file" ]; then' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '      ln -sf "$file" /app/stable-diffusion-webui/models/Stable-diffusion/' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '      echo "Linked model: $file"' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '    fi' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo '  done' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo 'fi' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    echo 'python3 launch.py --skip-torch-cuda-test --api --xformers "$@"' >> /app/stable-diffusion-webui/sd_launcher.sh && \
    chmod +x /app/stable-diffusion-webui/sd_launcher.sh && \
    chmod +x /app/stable-diffusion-webui/webui.sh

# Create a helper script for downloading models
RUN echo '#!/bin/bash' > /app/download_models.sh && \
    echo '# Download models script for VelesAI Server' >> /app/download_models.sh && \
    echo 'mkdir -p /models/stable-diffusion' >> /app/download_models.sh && \
    echo 'mkdir -p /models/llm' >> /app/download_models.sh && \
    echo '' >> /app/download_models.sh && \
    echo '# Download a small Stable Diffusion model for testing' >> /app/download_models.sh && \
    echo 'if [ ! -f "/models/stable-diffusion/dreamshaper-8.safetensors" ]; then' >> /app/download_models.sh && \
    echo '  echo "Downloading DreamShaper v8 (lightweight SD model)..."' >> /app/download_models.sh && \
    echo '  wget --show-progress https://huggingface.co/Lykon/dreamshaper-8/resolve/main/dreamshaper_8.safetensors -O /models/stable-diffusion/dreamshaper-8.safetensors' >> /app/download_models.sh && \
    echo 'fi' >> /app/download_models.sh && \
    echo '' >> /app/download_models.sh && \
    echo '# Download a small LLM for testing' >> /app/download_models.sh && \
    echo 'if [ ! -f "/models/llm/phi-2.gguf" ]; then' >> /app/download_models.sh && \
    echo '  echo "Downloading Phi-2 (small LLM model)..."' >> /app/download_models.sh && \
    echo '  wget --show-progress https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q5_K_M.gguf -O /models/llm/phi-2.gguf' >> /app/download_models.sh && \
    echo 'fi' >> /app/download_models.sh && \
    echo '' >> /app/download_models.sh && \
    echo 'echo "Model downloads complete!"' >> /app/download_models.sh && \
    chmod +x /app/download_models.sh

# ==================
# Application Stage
# ==================
FROM base AS final

WORKDIR /app

# Copy the latest application source code
COPY backend /app/backend
COPY frontend /app/frontend

# Copy Stable Diffusion WebUI from the base stage
COPY --from=base /app/stable-diffusion-webui /app/stable-diffusion-webui

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/allowed_ips_frontend.conf /etc/nginx/allowed_ips_frontend.conf
COPY nginx/allowed_ips_llm.conf /etc/nginx/allowed_ips_llm.conf
COPY nginx/allowed_ips_sd.conf /etc/nginx/allowed_ips_sd.conf

# Ensure models directory exists
RUN mkdir -p /models

# ------------------
# Create RunPod entrypoint script
# ------------------
WORKDIR /app
RUN printf '#!/bin/bash\n\n\
# Ensure directories exist\n\
mkdir -p /run/sshd\n\
mkdir -p /models/stable-diffusion\n\
mkdir -p /models/llm\n\n\
# --- Configure Nginx IP Whitelisting --- \n\
configure_allowlist() {\n\
  local env_var_name="$1"\n\
  local config_file="$2"\n\
  local service_name="$3"\n\
  local env_var_value="${!env_var_name}"\n\
  echo "Configuring allowlist for $service_name..."\n\
  if [ -z "$env_var_value" ] || [ "$env_var_value" = "all" ] || [ "$env_var_value" = "0.0.0.0" ] || [ "$env_var_value" = "0.0.0.0/0" ]; then\n\
    echo "# Allow all IPs ($env_var_name=$env_var_value)" > "$config_file"\n\
    echo "0.0.0.0/0 1;" >> "$config_file"\n\
    echo "$service_name IP whitelist configuration: ALL IPS ALLOWED"\n\
  else\n\
    echo "# Generated $service_name whitelist from $env_var_name env var" > "$config_file"\n\
    IFS="," read -ra IPS <<< "$env_var_value"\n\
    for ip in "${IPS[@]}"; do\n\
      # Trim whitespace from IP/CIDR\n\
      trimmed_ip=$(echo "$ip" | xargs)\n\
      if [ -n "$trimmed_ip" ]; then\n\
         echo "$trimmed_ip 1;" >> "$config_file"\n\
      fi\n\
    done\n\
    echo "$service_name IP whitelist configuration:"\n\
    cat "$config_file"\n\
  fi\n\
}\n\n\
configure_allowlist "ALLOWLIST_FRONTEND" "/etc/nginx/allowed_ips_frontend.conf" "Frontend UI (Port 3000)"\n\
configure_allowlist "ALLOWLIST_LLM" "/etc/nginx/allowed_ips_llm.conf" "LLM (Port 1337)"\n\
configure_allowlist "ALLOWLIST_SD" "/etc/nginx/allowed_ips_sd.conf" "Stable Diffusion (Port 7860)"\n\n\
# Check for Stable Diffusion models\n\
echo "Checking for Stable Diffusion models in /models/stable-diffusion..."\n\
if [ -d "/models/stable-diffusion" ]; then\n\
  file_count=$(find /models/stable-diffusion -type f \\( -name "*.safetensors" -o -name "*.ckpt" \\) | wc -l)\n\
  if [ "$file_count" -gt 0 ]; then\n\
    echo "Found $file_count SD model(s)"\n\
  else\n\
    echo "No SD models found."\n\
  fi\n\
fi\n\n\
# Check for LLM models\n\
echo "Checking for LLM models in /models/llm..."\n\
if [ -d "/models/llm" ]; then\n\
  file_count=$(find /models/llm -type f -name "*.gguf" | wc -l)\n\
  if [ "$file_count" -gt 0 ]; then\n\
    echo "Found $file_count LLM model(s)"\n\
  else\n\
    echo "No LLM models found."\n\
  fi\n\
fi\n\n\
# Start services\n\
trap "exit" INT TERM\n\
trap "kill 0" EXIT\n\n\
# Backend API\n\
cd /app/backend\n\
echo "Starting backend API on port 8000..."\n\
uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
\n\
# Frontend\n\
cd /app/frontend\n\
echo "Starting frontend on internal port 3001..."\n\
npm run preview -- --host 0.0.0.0 --port 3001 &\n\n\
# SSH and Nginx\n\
echo "Starting SSH and Nginx..."\n\
/usr/sbin/sshd -D &\n\
nginx\n\n\
# Block on SSH process\n\
wait $!\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# ------------------
# Build frontend production assets
# ------------------
WORKDIR /app/frontend
RUN npm run build

ENTRYPOINT ["/app/entrypoint.sh"]
