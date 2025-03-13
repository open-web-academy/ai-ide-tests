export interface AIModel {
  name: string;
  code: string;
  description: string;
}

export const availableModels: AIModel[] = [
  {
    name: "Body Pose Detection",
    code: `// ML5.js Body Pose Detection
let video;
let bodyPose;
let poses = [];
let connections;

function preload() {
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getSkeleton();
}

function draw() {
  image(video, 0, 0, width, height);
  drawKeypoints();
  drawSkeleton();
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      if (keypoint.confidence > 0.2) {
        fill(0, 255, 0);
        noStroke();
        circle(keypoint.x, keypoint.y, 10);
      }
    }
  }
}

function drawSkeleton() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      let partA = pose.keypoints[connections[j][0]];
      let partB = pose.keypoints[connections[j][1]];
      if (partA.confidence > 0.2 && partB.confidence > 0.2) {
        stroke(255, 0, 0);
        line(partA.x, partA.y, partB.x, partB.y);
      }
    }
  }
}

function gotPoses(results) {
  poses = results;
}`,
    description: "Detect body poses using ML5.js and webcam input"
  },
  {
    name: "TensorFlow MNIST",
    code: `// TensorFlow.js MNIST Example
async function runModel() {
  const model = tf.sequential({
    layers: [
      tf.layers.conv2d({
        inputShape: [28, 28, 1],
        kernelSize: 3,
        filters: 16,
        activation: 'relu'
      }),
      tf.layers.maxPooling2d({poolSize: 2, strides: 2}),
      tf.layers.conv2d({kernelSize: 3, filters: 32, activation: 'relu'}),
      tf.layers.maxPooling2d({poolSize: 2, strides: 2}),
      tf.layers.conv2d({kernelSize: 3, filters: 32, activation: 'relu'}),
      tf.layers.flatten({}),
      tf.layers.dense({units: 64, activation: 'relu'}),
      tf.layers.dense({units: 10, activation: 'softmax'})
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  const mnist = await tf.data.mnist();
  const {images: trainImages, labels: trainLabels} = mnist.trainDataset;
  
  await model.fit(trainImages, trainLabels, {
    epochs: 5,
    validationSplit: 0.15,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(\`Epoch \${epoch + 1} - loss: \${logs.loss.toFixed(4)} - acc: \${logs.acc.toFixed(4)}\`);
      }
    }
  });
}

runModel();`,
    description: "Train a CNN on MNIST dataset using TensorFlow.js"
  }
];