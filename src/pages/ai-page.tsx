import { useState, useCallback, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

const initialCode = `
// Example ML5.js Sentiment Analysis (Global Mode)
// This code is taken intact from sentiments_ml5.js

let sentiment;
let submitBtn;
let inputBox;
let sentimentResult;

function preload() {
  // Initialize the sentiment analysis model
  sentiment = ml5.sentiment("MovieReviews");
}

function setup() {
  noCanvas();

  // Setup the DOM elements
  inputBox = createInput("Today is the happiest day and is full of rainbows!");
  inputBox.attribute("size", "75");
  submitBtn = createButton("submit");
  sentimentResult = createP("Sentiment confidence:");

  // Start predicting when the submit button is pressed
  submitBtn.mousePressed(getSentiment);
}

function getSentiment() {
  // Use the value of the input box
  let text = inputBox.value();

  // Start making the prediction
  sentiment.predict(text, gotResult);
}

function gotResult(prediction) {
  // Display sentiment result via the DOM
  sentimentResult.html("Sentiment confidence: " + prediction.confidence);
}

// Start predicting when the Enter key is pressed
function keyPressed() {
  if (keyCode === ENTER) {
    getSentiment();
  }
}
`;

export default function AIPage() {
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const codeExecutionRef = useRef<{ cleanup?: () => void }>({});

  // Cargar p5.js y ml5.js secuencialmente
  const loadAILibraries = useCallback(async () => {
    const libraries = {
      p5: {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js',
        global: 'p5'
      },
      ml5: {
        url: 'https://unpkg.com/ml5@0.12.2/dist/ml5.min.js',
        global: 'ml5'
      }
    };

    try {
      setOutput(prev => [...prev, '📚 Loading AI libraries...']);
      setOutput(prev => [...prev, '⏳ Cargando p5.js y ml5.js, por favor espere...']);

      // Guardar window.define para evitar conflictos AMD
      const originalDefine = window.define;
      if (window.define && window.define.amd) {
        window.define = undefined;
      }

      for (const [name, lib] of Object.entries(libraries)) {
        if (window[lib.global]) {
          setOutput(prev => [...prev, `✓ ${name} already loaded`]);
          continue;
        }
        const script = document.createElement('script');
        script.src = lib.url;
        script.async = false;
        script.id = `${name}-script`;

        await new Promise((resolve, reject) => {
          script.onload = () => {
            setTimeout(() => {
              if (window[lib.global]) {
                setOutput(prev => [...prev, `✅ ${name} loaded successfully`]);
                resolve(true);
              } else {
                reject(new Error(`${name} loaded but global ${lib.global} not found`));
              }
            }, 300);
          };
          script.onerror = () => reject(new Error(`Failed to load ${name}`));
          document.head.appendChild(script);
        });
      }
      setOutput(prev => [...prev, '✨ All libraries loaded successfully']);
      setLibrariesLoaded(true);

      // Restaurar window.define
      window.define = originalDefine;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Library loading error:', message);
      setOutput(prev => [...prev, `❌ Error: ${message}`]);
      throw new Error(`Failed to load libraries: ${message}`);
    }
  }, [setOutput]);

  const runCode = useCallback(async () => {
    try {
        setOutput([]);
        setIsRunning(true);
        if (!librariesLoaded) {
            setOutput(prev => [...prev, '⏳ Esperando a que p5.js y ml5.js se hayan cargado...']);
            await loadAILibraries();
        }

        if (canvasRef.current) {
            canvasRef.current.innerHTML = '';
            // Crear un contenedor para los elementos del modelo
            const modelUI = document.createElement('div');
            modelUI.className = 'flex flex-col gap-4 text-white';
            canvasRef.current.appendChild(modelUI);

            // Sobrescribir las funciones de p5 para usar nuestro contenedor
            window.noCanvas = () => {
                console.log('noCanvas called');
            };

            window.createInput = (value) => {
                const input = document.createElement('input');
                input.value = value || '';
                input.className = 'p-2 rounded bg-gray-700 text-white';
                modelUI.appendChild(input);
                input.attribute = (name, value) => input.setAttribute(name, value);
                input.value = () => input.value;
                return input;
            };

            window.createButton = (label) => {
                const button = document.createElement('button');
                button.textContent = label;
                button.className = 'p-2 bg-blue-500 rounded hover:bg-blue-600';
                modelUI.appendChild(button);
                button.mousePressed = (callback) => {
                    button.onclick = callback;
                };
                return button;
            };

            window.createP = (text) => {
                const p = document.createElement('p');
                p.textContent = text;
                p.className = 'p-2';
                modelUI.appendChild(p);
                p.html = (content) => {
                    p.innerHTML = content;
                };
                return p;
            };
        }

        // Sobrescribir funciones globales de p5.js (para evitar crear canvas innecesario)
        window.noCanvas = () => {
            console.log('noCanvas llamada, sin crear canvas');
        };

        // (Opcional) Si deseas sobrescribir createInput/createButton/createP, puedes hacerlo aquí,
        // pero si no se modifican, los elementos se agregarán al body. Luego se moverán.

        // Configurar console logging
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn
        };

        console.log = (...args) => {
            setOutput(prev => [...prev, args.join(' ')]);
            originalConsole.log(...args);
        };

        console.error = (...args) => {
            setOutput(prev => [...prev, `❌ ${args.join(' ')}`]);
            originalConsole.error(...args);
        };

        console.warn = (...args) => {
            setOutput(prev => [...prev, `⚠️ ${args.join(' ')}`]);
            originalConsole.warn(...args);
        };

        codeExecutionRef.current.cleanup = () => {
            Object.assign(console, originalConsole);
            if (canvasRef.current) {
                canvasRef.current.innerHTML = '';
            }
        };

        // Ejecutar el código tal cual, sin modificar el initialCode
        const executeCode = new Function(code);
        executeCode();

        // Llamar a setup() manualmente, ya que el código se ejecuta en modo global
        if (typeof window.setup === 'function') {
            window.setup();
        }

        // Mover manualmente los elementos creados por p5.js al contenedor "canvas-container"
        // (ya que p5, en modo global, crea estos elementos en el body por defecto)
        setTimeout(() => {
            if (canvasRef.current) {
                // Selecciona los elementos creados por el script
                const elems = document.querySelectorAll('input, button, p');
                elems.forEach(el => {
                    // Evitar duplicados: si aún no está contenido en nuestro contenedor, lo movemos
                    if (!canvasRef.current.contains(el)) {
                        canvasRef.current.appendChild(el);
                    }
                });
            }
        }, 500);

    } catch (error) {
        setOutput(prev => [
            ...prev,
            `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]);
        setIsRunning(false);
    }
}, [code, loadAILibraries, librariesLoaded]);

  const stopCode = useCallback(() => {
    if (codeExecutionRef.current.cleanup) {
      codeExecutionRef.current.cleanup();
    }
    setIsRunning(false);
    setOutput(prev => [...prev, '✓ Model stopped']);
  }, []);

  useEffect(() => {
    return () => {
      if (codeExecutionRef.current.cleanup) {
        codeExecutionRef.current.cleanup();
      }
    };
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-4 border-r border-gray-300 flex flex-col">
        <MonacoEditor
          height="calc(100vh - 120px)"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => value && setCode(value)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            suggest: { snippetsPreventQuickSuggestions: false }
          }}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`px-5 py-2.5 ${
              isRunning ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md transition-colors duration-200`}
          >
            {isRunning ? 'Running...' : 'Run Model'}
          </button>
          <button
            onClick={stopCode}
            disabled={!isRunning}
            className={`px-5 py-2.5 ${
              !isRunning ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'
            } text-white rounded-md transition-colors duration-200`}
          >
            Stop
          </button>
        </div>
      </div>
      <div className="w-1/2 p-4 flex flex-col">
        <div className="mb-4 h-[480px] flex flex-col">
          <div 
            id="model-container"
            ref={canvasRef}
            className="bg-gray-800 p-4 rounded-lg flex-1 overflow-y-auto"
          >
            {!isRunning && (
              <div className="text-gray-400">
                Model interface will appear here when started
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono flex-1 overflow-y-auto">
          {output.length === 0 ? (
            <div className="text-gray-500">// Model output will appear here...</div>
          ) : (
            output.map((text, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {`> ${text}`}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}