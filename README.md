# 📦 Velesio AI Server

**Velesio AI Server** is a web application aiming to provide a simple framework to host open source AI models, be it on-prem or in the cloud, which can be used by both Unity and Web Applications.

To access this in unity you can use the linked repos bellow, a unified unity integration for all of this app's services is currently under development and will soon be published to the Asset Store.

This has only been tested on NVIDIA GPUs with Cuda 12.2 and higher and is developed with that environment in mind.

---

## 🚀 Deployment Made Easy

### 🌐 Cloud Deployment with Runpod

Deploy effortlessly using the [Runpod template](https://www.runpod.io/console/explore/07cky3lznr). It's a plug-and-play solution for hosting in the cloud.

New to Runpod? Use my [referral link](https://runpod.io?ref=muhg2w55) to get started!

---

### 🏠 Self-Hosting Quickstart

Get up and running locally with just a few steps:

1. **Install Docker Compose**  
  Follow the [official guide](https://docs.docker.com/compose/install/linux/) to set up Docker Compose.

2. **Clone & Compose**  
  ```bash
  git clone https://github.com/Velesio/Velesio-AIServer.git
  cd Velesio-AIServer/velesio
  docker compose up -d
  ```

  **Exposed Ports:**
  - `3000` - Vite frontend  
  - `1337` - Undream AI server  
  - `7860` - Stable Diffusion Automatic 1111 webserver  

  These ports are reverse-proxied through Nginx. Access control can be managed via the `ALLOWLIST` environment variables, as Runpod currently lacks built-in firewall functionality.

---

### 📦 Docker Image

Prefer using Docker directly? Check out our [Docker Hub repository](https://hub.docker.com/repository/docker/teocholakov/velesio-aiserver).

---

### 💬 Need Help?

Join our [Discord community](https://discord.gg/pMB6w3mJyF) for support, discussions, and sharing ideas.

---

## ✨ Key Features

- ⚡ **Plug and play AI hosting** for Unity — no heavy setup required  
- 🧠 Built for **self-hosting and the cloud**
- 🛠️ Built to be **open, extensible, and developer-friendly**  

---
## 🚧 Roadmap

Stay tuned for:

- ✅ Unity Integration Asset
- ✅ Documentation
- ✅ API Service
- ✅ Ollama support
- ✅ Flux support

Follow the repo, drop a ⭐, and join the journey!

---

## 🧱 Built On the Shoulders of Great Open-Source

Veles would not be possible without the amazing work from the open-source community. Special thanks to:

- 🧠 [**LLM for Unity**](https://github.com/undreamai/LLMUnity) by *Undream AI* (MIT License)  
  A streamlined interface for integrating LLMs into Unity.

- 🎨 [**Stable-Diffusion-Unity-Integration**](https://github.com/dobrado76/Stable-Diffusion-Unity-Integration) by *Dobrado76* (Apache 2.0)  
  A powerful image-generation pipeline with Stable Diffusion.

- 🎨 [**AUTOMATIC1111/stable-diffusion-webui**](https://github.com/AUTOMATIC1111/stable-diffusion-webui)

Their projects serve as a foundation and inspiration for this unified framework.

---