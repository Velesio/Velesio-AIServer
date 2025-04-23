# 📦 Velesio AI Server

**Velesio** is a next-generation AI integration framework for Unity developers, built to simplify and supercharge the way games interact with powerful language and diffusion models.

Whether you're building immersive NPCs, intelligent agents, or AI-driven tools, Veles gives you a seamless plug-and-play interface to tap into both local and cloud-hosted AI systems — all from within Unity.

With this repo you can locally host your own llamacpp and Stable Diffusion server which can seemlessly connect to Unity, using the LLM For Unity asset by UndreamAI and the Stable Diffusion Integration, linked bellow.

[Runpod template](https://www.runpod.io/console/explore/07cky3lznr) to host self-host this in the cloud.

Self-hosting quickstart:

git clone https://github.com/Velesio/Velesio-AIServer.git
cd Velesio-AIServer/velesio
docker compose up -d

Port 3000 - Vite frontend
Port 1337 - Undreamai server
Port 7860 - Stable Diffusion Automatic 1111 webserver

Each of the ports is reverse proxied in nginx, access can be managed through nginx in the ALLOWLIST env vars. This was neccesary because Runpod currently does not offer firewall functionality.

[Docker](https://hub.docker.com/repository/docker/teocholakov/velesio-aiserver)

[Discord](https://discord.gg/pMB6w3mJyF) for support and ideas

---

## ✨ Key Features (Coming Soon)

- ⚡ **Plug and play AI hosting** for Unity — no heavy setup required  
- 🧠 Built for **self-hosting and the cloud**
- 🛠️ Built to be **open, extensible, and developer-friendly**  

---
## 🚧 Project Status

Veles is in early development. Stay tuned for:

- ✅ Unity Integration combining the projects this is based on
- ✅ Documentation
- ✅ API Service
- ✅ Flux support
- ✅ Ollama support
- ✅ Proprietary models support

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