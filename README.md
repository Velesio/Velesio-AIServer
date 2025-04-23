# 📦 Velesio AI Server

**Velesio AI Server** is a web application aiming to provide a simple framework to host open source AI models, be it on-prem or in the cloud, which can be used by both Unity and Web Applications.

To access this in unity you can use the linked repos bellow, a unified unity integration for all of this app's services is currently under development and will soon be published to the Asset Store.

This has only been tested on NVIDIA GPUs with Cuda 12.2 and higher and is developed with that environment in mind.

[Runpod template](https://www.runpod.io/console/explore/07cky3lznr) for plug and play cloud deployment

New to Runpod? Here's my [referral link](https://runpod.io?ref=muhg2w55)!

Self-hosting quickstart:

Install [docker compose](https://docs.docker.com/compose/install/linux/)

```bash
git clone https://github.com/Velesio/Velesio-AIServer.git
cd Velesio-AIServer/velesio
docker compose up -d
```

```
Port 3000 - Vite frontend  
Port 1337 - Undreamai server  
Port 7860 - Stable Diffusion Automatic 1111 webserver  
```

Each of the ports is reverse proxied in nginx, access can be managed through nginx in the ALLOWLIST env vars. This was neccesary because Runpod currently does not offer firewall functionality.

[Docker](https://hub.docker.com/repository/docker/teocholakov/velesio-aiserver)

[Discord](https://discord.gg/pMB6w3mJyF) for support and ideas

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