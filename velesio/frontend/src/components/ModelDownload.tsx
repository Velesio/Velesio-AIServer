import { useState, useRef, useLayoutEffect } from 'react';
import { useTheme } from '../context/useTheme';

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-8 w-8" 
         style={{ borderColor: 'var(--accent-color) transparent var(--accent-color) transparent' }}></div>
);

// Unique identifier for the component
const COMPONENT_UNIQUE_CLASS = 'model-download-container-root';

export function ModelDownloadContainer() {
    // Track if this instance should render content
    const [shouldRender, setShouldRender] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);
    
    // Check for duplicates before initial render
    useLayoutEffect(() => {
        const existingInstances = document.getElementsByClassName(COMPONENT_UNIQUE_CLASS);
        
        // If this is not the first instance, don't render
        if (existingInstances.length > 0 && componentRef.current !== existingInstances[0]) {
            setShouldRender(false);
        }
    }, []);
    
    // Don't render anything if this is a duplicate
    if (!shouldRender) {
        return null;
    }

    return (
        <div 
            ref={componentRef}
            className={COMPONENT_UNIQUE_CLASS}
            style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                gap: '20px',
                width: '100%',
                maxWidth: '800px', // Match standard content box width
                margin: '0 auto', // Center the container
                flexWrap: 'wrap',
            }}
        >
            <LLMModelDownload />
            <SDModelDownload />
        </div>
    );
}

const predefinedLLMModels = {
    "Medium models": [
        { name: "Llama 3.1 8B", url: "https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf?download=true", filename: "llama3.1-8b" },
        { name: "Qwen 2.5 7B", url: "https://huggingface.co/lmstudio-community/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf?download=true", filename: "qwen2.5-7b" },
        { name: "DeepSeek R1 Distill Llama 8B", url: "https://huggingface.co/lmstudio-community/DeepSeek-R1-Distill-Llama-8B-GGUF/resolve/main/DeepSeek-R1-Distill-Llama-8B-Q4_K_M.gguf?download=true", filename: "deepseek-r1-distill-llama-8b" },
        { name: "Gemma 2 9B it", url: "https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf?download=true", filename: "gemma2-9b-it" }
    ],
    "Small models": [
        { name: "Llama 3.2 3B", url: "https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-3b-instruct-q4_k_m.gguf", filename: "llama3.2-3b" },
        { name: "Qwen 2.5 3B", url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true", filename: "qwen2.5-3b" }
    ],
    "Tiny models": [
        { name: "Llama 3.2 1B", url: "https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-1b-instruct-q4_k_m.gguf", filename: "llama3.2-1b" },
        { name: "Qwen 2 0.5B", url: "https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q4_k_m.gguf?download=true", filename: "qwen2-0.5b" }
    ]
};

const predefinedSDModels = {
    "Stable Diffusion v1.5": [
        { name: "SD v1.5 Pruned Emaonly", url: "https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors", filename: "stable-diffusion-v1-5" }
    ],
    "DreamShaper Models": [
        { 
            name: "DreamShaper 8.0 (Realistic)", 
            url: "https://civitai.com/api/download/models/128713?type=Model&format=SafeTensor&size=pruned&fp=fp16", 
            filename: "dreamshaper-8"
        }
    ]
};

export function LLMModelDownload() {
    const { theme } = useTheme();
    const [url, setUrl] = useState('');
    const [selectedModel, setSelectedModel] = useState<{ url: string; filename: string } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<{message: string, success: boolean} | null>(null);

    const getContainerStyle = () => {
        // Standardized style for individual download boxes
        return {
            width: '100%',
            maxWidth: 'calc(50% - 10px)', // Adjust width for side-by-side layout
            minWidth: '300px', // Ensure minimum width on smaller screens/wraps
            margin: '0', // Margin handled by parent flex gap
            padding: '1.5rem',
            borderRadius: 'var(--border-radius)',
            backgroundColor: theme === 'cyberpunk' ? 'var(--primary-bg)' : 'var(--primary-bg)', // Use primary for consistency with Settings sections
            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
            flex: '1', // Allow flex grow/shrink
        };
    };

    const getInputStyle = () => {
        return {
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-color)',
            border: theme === 'cyberpunk' ? '1px solid #666' : '1px solid #d1d5db'
        };
    };

    const getApiBaseUrl = () => {
        return '/api';
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadStatus(null);

        // Filename sent here is ignored by backend, but keep for consistency
        const filename = selectedModel ? selectedModel.filename : 'custom_model';
        const downloadUrl = selectedModel ? selectedModel.url : url;

        const downloadData = {
            url: downloadUrl,
            filename: filename, // Backend will ignore this and extract from URL
            type: 'llm'
        };

        try {
            const response = await fetch(`${getApiBaseUrl()}/download-model/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(downloadData)
            });

            if (response.ok) {
                const result = await response.json(); // Parse the JSON response from backend
                setDownloadStatus({
                    // Use the actual filename returned by the backend
                    message: `Model downloaded successfully as "${result.downloaded_filename}"!`,
                    success: true
                });
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to download model. Please check server logs.' }));
                setDownloadStatus({
                    message: errorData.detail || 'Failed to download model. Please try again.',
                    success: false
                });
            }
        } catch (error) {
            setDownloadStatus({
                message: 'Network error occurred. Please check your connection.',
                success: false
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 rounded-lg shadow-lg" style={getContainerStyle()}>
            <h2 className={`text-2xl font-bold text-center mb-4 ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                LlamaCPP (.gguf)
            </h2>

            <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="mb-8 text-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <label className="block mb-3">Pre-configured LLM Models:</label>
                    <select
                        style={{...getInputStyle(), textAlign: 'center', width: '280px'}}
                        onChange={(e) => {
                            const selected = Object.values(predefinedLLMModels)
                                .flat()
                                .find((model) => model.name === e.target.value);

                            if (selected) {
                                setSelectedModel(selected);
                                setUrl(selected.url);
                            } else {
                                setSelectedModel(null);
                                setUrl('');
                            }
                        }}
                    >
                        <option value="">-- Select a Model --</option>
                        {Object.entries(predefinedLLMModels).map(([category, models]) => (
                            <optgroup label={category} key={category}>
                                {models.map((model) => (
                                    <option key={model.name} value={model.name}>
                                        {model.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className="mb-8 text-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <label className="block mb-3">Custom LLM URL:</label>
                    <input
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setSelectedModel(null);
                        }}
                        placeholder="LLM Model URL (.gguf)"
                        style={{...getInputStyle(), textAlign: 'center', width: '280px'}}
                    />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 auto', textAlign: 'center'}} className="mt-10 mb-4">
                    <button 
                        onClick={handleDownload} 
                        className="px-4 py-2 rounded-md mx-auto"
                        disabled={isDownloading}
                        style={{ 
                            backgroundColor: 'var(--button-primary)',
                            color: '#ffffff',
                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                            border: theme === 'corporate' ? '1px solid #000' : 'none',
                            transition: 'all 0.2s ease-in-out',
                            width: '180px',
                            opacity: isDownloading ? 0.7 : 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isDownloading && <Spinner />}
                        {isDownloading ? 'Downloading...' : 'Download Model'}
                    </button>
                    
                    {downloadStatus && (
                        <div className="mt-4 p-3 rounded-md" style={{
                            backgroundColor: downloadStatus.success ? 
                                (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : 
                                (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                            color: downloadStatus.success ? 
                                (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                                (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                            border: theme === 'cyberpunk' ? 
                                `1px solid ${downloadStatus.success ? '#10b981' : '#ef4444'}` : 
                                'none',
                            maxWidth: '400px',
                        }}>
                            {downloadStatus.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function SDModelDownload() {
    const { theme } = useTheme();
    const [url, setUrl] = useState('');
    const [selectedModel, setSelectedModel] = useState<{ url: string; filename: string } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<{message: string, success: boolean} | null>(null);

    const getContainerStyle = () => {
        // Standardized style for individual download boxes
        return {
            width: '100%',
            maxWidth: 'calc(50% - 10px)', // Adjust width for side-by-side layout
            minWidth: '300px', // Ensure minimum width on smaller screens/wraps
            margin: '0', // Margin handled by parent flex gap
            padding: '1.5rem',
            borderRadius: 'var(--border-radius)',
            backgroundColor: theme === 'cyberpunk' ? 'var(--primary-bg)' : 'var(--primary-bg)', // Use primary for consistency with Settings sections
            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
            flex: '1', // Allow flex grow/shrink
        };
    };

    const getInputStyle = () => {
        return {
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-color)',
            border: theme === 'cyberpunk' ? '1px solid #666' : '1px solid #d1d5db'
        };
    };

    const getApiBaseUrl = () => {
        return '/api';
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadStatus(null);

        // Filename sent here is ignored by backend, but keep for consistency
        const filename = selectedModel ? selectedModel.filename : 'custom_model';
        const downloadUrl = selectedModel ? selectedModel.url : url;

        const downloadData = {
            url: downloadUrl,
            filename: filename, // Backend will ignore this and extract from URL
            type: 'sd'
        };

        try {
            const response = await fetch(`${getApiBaseUrl()}/download-model/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(downloadData)
            });

            if (response.ok) {
                const result = await response.json(); // Parse the JSON response from backend
                setDownloadStatus({
                     // Use the actual filename returned by the backend
                    message: `Model downloaded successfully as "${result.downloaded_filename}"!`,
                    success: true
                });
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to download model. Please check server logs.' }));
                setDownloadStatus({
                    message: errorData.detail || 'Failed to download model. Please try again.',
                    success: false
                });
            }
        } catch (error) {
            setDownloadStatus({
                message: 'Network error occurred. Please check your connection.',
                success: false
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 rounded-lg shadow-lg" style={getContainerStyle()}>
            <h2 className={`text-2xl font-bold text-center mb-4 ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                Stable Diffusion (.safetensors)
            </h2>

            <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="mb-8 text-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <label className="block mb-3">Pre-configured SD Models:</label>
                    <select
                        style={{...getInputStyle(), textAlign: 'center', width: '280px'}}
                        onChange={(e) => {
                            const selected = Object.values(predefinedSDModels)
                                .flat()
                                .find((model) => model.name === e.target.value);

                            if (selected) {
                                setSelectedModel(selected);
                                setUrl(selected.url);
                            } else {
                                setSelectedModel(null);
                                setUrl('');
                            }
                        }}
                    >
                        <option value="">-- Select a Model --</option>
                        {Object.entries(predefinedSDModels).map(([category, models]) => (
                            <optgroup label={category} key={category}>
                                {models.map((model) => (
                                    <option key={model.name} value={model.name}>
                                        {model.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className="mb-8 text-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <label className="block mb-3">Custom SD URL:</label>
                    <input
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setSelectedModel(null);
                        }}
                        placeholder="SD Model URL (.safetensors)"
                        style={{...getInputStyle(), textAlign: 'center', width: '280px'}}
                    />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 auto', textAlign: 'center'}} className="mt-10 mb-4">
                    <button 
                        onClick={handleDownload} 
                        className="px-4 py-2 rounded-md mx-auto"
                        disabled={isDownloading}
                        style={{ 
                            backgroundColor: 'var(--button-primary)',
                            color: '#ffffff',
                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                            border: theme === 'corporate' ? '1px solid #000' : 'none',
                            transition: 'all 0.2s ease-in-out',
                            width: '180px',
                            opacity: isDownloading ? 0.7 : 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isDownloading && <Spinner />}
                        {isDownloading ? 'Downloading...' : 'Download Model'}
                    </button>
                    
                    {downloadStatus && (
                        <div className="mt-4 p-3 rounded-md" style={{
                            backgroundColor: downloadStatus.success ? 
                                (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : 
                                (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                            color: downloadStatus.success ? 
                                (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                                (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                            border: theme === 'cyberpunk' ? 
                                `1px solid ${downloadStatus.success ? '#10b981' : '#ef4444'}` : 
                                'none',
                            maxWidth: '400px',
                        }}>
                            {downloadStatus.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
