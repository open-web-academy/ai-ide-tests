import { useState, useCallback, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as tf from '@tensorflow/tfjs';

const initialCode = `
// TensorFlow.js Example - Simple Linear Regression
async function runModel() {
  // Create a simple model
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 1, inputShape: [1]}));
  
  // Prepare the model for training
  model.compile({
    loss: 'meanSquaredError',
    optimizer: 'sgd'
  });
  
  // Generate some synthetic data for training
  const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
  const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);
  
  // Train the model
  await model.fit(xs, ys, {
    epochs: 50,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(\`Epoch \${epoch + 1} - Loss: \${logs.loss.toFixed(4)}\`);
      }
    }
  });
  
  // Make predictions
  const testInput = tf.tensor2d([5, 6, 7], [3, 1]);
  const predictions = model.predict(testInput);
  console.log('Predictions:');
  predictions.print();
  
  // Cleanup
  model.dispose();
  xs.dispose();
  ys.dispose();
  testInput.dispose();
  predictions.dispose();
}

// Run the model
runModel().catch(console.error);
`;

export default function TensorflowPage() {
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const codeExecutionRef = useRef<{ cleanup?: () => void }>({});

  const runCode = useCallback(async () => {
    try {
      setOutput([]);
      setIsRunning(true);

      // Log TensorFlow.js information safely
      const tfVersion = tf?.version?.tfjs || 'unknown';
      const backend = tf?.getBackend() || 'unknown';
      const backends = tf?.engine()?.registeredBackends || [];

      setOutput(prev => [
        ...prev,
        `✅ Using TensorFlow.js version: ${tfVersion}`,
        `📊 Backend: ${backend}`,
        `🧮 Available backends: ${backends.join(', ') || 'none'}`
      ]);

      // Configure console logging
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
        // Clean up any tensors
        tf.disposeVariables();
      };

      // Execute the code with tf in scope
      const executeCode = new Function('tf', code);
      await executeCode(tf);

    } catch (error) {
      setOutput(prev => [
        ...prev,
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

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
            folding: true
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
        <div 
          ref={outputRef}
          className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono h-full overflow-y-auto"
        >
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