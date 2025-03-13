This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## TensorFlow.js Examples

This project includes several machine learning examples using TensorFlow.js. You can find these examples in the TensorFlow page of the application.

### Available Examples

1. **Basic Linear Regression**
   - Simple model that learns linear relationships
   - Demonstrates basic model creation, training, and prediction

2. **Image Recognition Transfer Learning**
   - Uses MobileNet as a feature extractor
   - Shows how to leverage pre-trained models
   - Implements a custom classifier on top of MobileNet

3. **Audio Waveform Classification**
   - Classifies audio frequencies
   - Uses 1D convolutions for audio processing
   - Demonstrates working with time-series data

4. **Text Generation with RNN**
   - Character-level text generation
   - Uses LSTM layers for sequence learning
   - Shows how to handle text data and generate new content

5. **Image Style Transfer**
   - Implements a simple style transfer model
   - Uses convolutional and transpose convolutional layers
   - Demonstrates image processing capabilities

6. **Anomaly Detection**
   - Uses autoencoders for anomaly detection
   - Shows how to handle normal vs anomalous data
   - Implements reconstruction-based anomaly detection

### Running the Examples

1. Navigate to the TensorFlow page in the application
2. Select an example from the editor
3. Click "Run Model" to execute the code
4. Watch the training progress and results in the output panel

### Example Codes

<details>
<summary>1. Basic Linear Regression</summary>

```javascript
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
        console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(4)}`);
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
```
</details>

<details>
<summary>2. Image Recognition Transfer Learning</summary>

```javascript
async function runModel() {
  console.log('Loading MobileNet...');
  const mobilenet = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );
  
  // Create a simple classifier using MobileNet's penultimate layer
  const layer = mobilenet.getLayer('conv_pw_13_relu');
  const truncatedModel = tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output
  });

  // Create a sample image tensor (224x224 RGB)
  const sampleImage = tf.randomNormal([1, 224, 224, 3]);
  
  console.log('Extracting features...');
  const features = truncatedModel.predict(sampleImage);
  console.log('Features shape:', features.shape);
  
  // Create a simple classifier on top
  const classifier = tf.sequential({
    layers: [
      tf.layers.globalAveragePooling2d({inputShape: features.shape.slice(1)}),
      tf.layers.dense({units: 10, activation: 'softmax'})
    ]
  });
  
  classifier.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  console.log('Classifier summary:');
  classifier.summary();
  
  // Cleanup
  mobilenet.dispose();
  truncatedModel.dispose();
  sampleImage.dispose();
  features.dispose();
  classifier.dispose();
}
```
</details>

<details>
<summary>3. Audio Waveform Classification</summary>

```javascript
async function runModel() {
  // Generate synthetic audio waveforms
  const generateWaveform = (freq, duration, sampleRate = 44100) => {
    const samples = duration * sampleRate;
    return tf.tidy(() => {
      const t = tf.linspace(0, duration, samples);
      return tf.sin(tf.mul(t, freq * 2 * Math.PI));
    });
  };

  // Create training data
  const lowFreq = generateWaveform(440, 1);  // A4 note
  const highFreq = generateWaveform(880, 1); // A5 note
  
  const xs = tf.concat([lowFreq, highFreq]).expandDims(-1);
  const ys = tf.tensor1d([0, 1]); // 0 for low, 1 for high

  // Create model
  const model = tf.sequential({
    layers: [
      tf.layers.conv1d({filters: 8, kernelSize: 3, activation: 'relu', inputShape: [44100, 1]}),
      tf.layers.maxPooling1d({poolSize: 2}),
      tf.layers.flatten(),
      tf.layers.dense({units: 1, activation: 'sigmoid'})
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  // Train
  await model.fit(xs, ys, {
    epochs: 10,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(4)} - Accuracy: ${logs.acc.toFixed(4)}`);
      }
    }
  });

  // Test
  const testFreq = generateWaveform(660, 1); // E5 note
  const prediction = model.predict(testFreq.expandDims(0).expandDims(-1));
  console.log('Prediction for 660Hz:', prediction.dataSync()[0]);

  // Cleanup
  model.dispose();
  xs.dispose();
  ys.dispose();
  testFreq.dispose();
  prediction.dispose();
}
```
</details>

<details>
<summary>4. Text Generation with RNN</summary>

```javascript
async function runModel() {
  // Sample text data
  const text = 'Hello TensorFlow.js! This is a simple example of text generation.';
  const chars = Array.from(new Set(text.split('')));
  const charToIdx = {};
  const idxToChar = {};
  chars.forEach((char, idx) => {
    charToIdx[char] = idx;
    idxToChar[idx] = char;
  });

  // Create model
  const model = tf.sequential({
    layers: [
      tf.layers.embedding({inputDim: chars.length, outputDim: 16, inputLength: 10}),
      tf.layers.lstm({units: 32, returnSequences: false}),
      tf.layers.dense({units: chars.length, activation: 'softmax'})
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy'
  });

  // Train and generate text
  console.log('Training model...');
  await model.fit(
    tf.tensor2d([...Array(10)].map(() => chars.map((_, i) => i)), [10, 10]),
    tf.oneHot([...Array(10)].map(() => Math.floor(Math.random() * chars.length)), chars.length),
    {
      epochs: 100,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 10 === 0) {
            console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(4)}`);
          }
        }
      }
    }
  );

  // Generate some text
  let input = text.slice(0, 10).split('').map(c => charToIdx[c]);
  let generated = text.slice(0, 10);

  for (let i = 0; i < 50; i++) {
    const prediction = model.predict(tf.tensor2d([input], [1, 10]));
    const nextIndex = tf.argMax(prediction, 1).dataSync()[0];
    generated += idxToChar[nextIndex];
    input = [...input.slice(1), nextIndex];
    prediction.dispose();
  }

  console.log('Generated text:', generated);
  model.dispose();
}
```
</details>

<details>
<summary>5. Image Style Transfer</summary>

```javascript
async function runModel() {
  // Create a simple style transfer model
  const styleModel = tf.sequential({
    layers: [
      // Encoder
      tf.layers.conv2d({
        inputShape: [64, 64, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      tf.layers.maxPooling2d({poolSize: 2}),
      
      // Style transformation
      tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }),
      
      // Decoder
      tf.layers.conv2dTranspose({
        filters: 32,
        kernelSize: 3,
        strides: 2,
        padding: 'same',
        activation: 'relu'
      }),
      tf.layers.conv2d({
        filters: 3,
        kernelSize: 3,
        activation: 'tanh',
        padding: 'same'
      })
    ]
  });

  styleModel.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError'
  });

  // Generate random image data
  const contentImage = tf.randomNormal([1, 64, 64, 3]);
  
  // Train the model
  console.log('Training style transfer model...');
  await styleModel.fit(contentImage, contentImage, {
    epochs: 10,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(4)}`);
      }
    }
  });

  // Generate styled image
  const styledImage = styleModel.predict(contentImage);
  console.log('Styled image shape:', styledImage.shape);

  // Cleanup
  styleModel.dispose();
  contentImage.dispose();
  styledImage.dispose();
}
```
</details>

<details>
<summary>6. Anomaly Detection</summary>

```javascript
async function runModel() {
  // Generate normal distribution data
  const numSamples = 1000;
  const normalData = tf.randomNormal([numSamples, 10]);
  
  // Create autoencoder
  const encoder = tf.sequential({
    layers: [
      tf.layers.dense({inputShape: [10], units: 6, activation: 'relu'}),
      tf.layers.dense({units: 3, activation: 'relu'})
    ]
  });

  const decoder = tf.sequential({
    layers: [
      tf.layers.dense({inputShape: [3], units: 6, activation: 'relu'}),
      tf.layers.dense({units: 10, activation: 'sigmoid'})
    ]
  });

  const autoencoder = tf.sequential();
  encoder.layers.forEach(layer => autoencoder.add(layer));
  decoder.layers.forEach(layer => autoencoder.add(layer));

  autoencoder.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError'
  });

  // Train on normal data
  await autoencoder.fit(normalData, normalData, {
    epochs: 50,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0) {
          console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(6)}`);
        }
      }
    }
  });

  // Test with anomalous data
  const anomalousData = tf.randomNormal([10, 10], 2, 1);
  const normalError = tf.metrics.meanSquaredError(
    normalData.slice([0, 0], [10, 10]),
    autoencoder.predict(normalData.slice([0, 0], [10, 10]))
  );
  const anomalyError = tf.metrics.meanSquaredError(
    anomalousData,
    autoencoder.predict(anomalousData)
  );

  console.log('Normal reconstruction error:', normalError.dataSync()[0]);
  console.log('Anomaly reconstruction error:', anomalyError.dataSync()[0]);

  // Cleanup
  autoencoder.dispose();
  normalData.dispose();
  anomalousData.dispose();
}
```
</details>

### Technical Requirements

- The examples run entirely in the browser using TensorFlow.js
- No additional backend or GPU required
- Recommended to use a modern browser for best performance

For more information about TensorFlow.js, visit the [official documentation](https://www.tensorflow.org/js).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
