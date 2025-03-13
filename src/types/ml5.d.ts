declare module 'ml5' {
  export interface Keypoint {
    x: number;
    y: number;
    confidence: number;
  }

  export interface Pose {
    keypoints: Keypoint[];
  }

  export interface BodyPose {
    detectStart: (video: any, callback: (poses: Pose[]) => void) => void;
    getSkeleton: () => [number, number][];
  }

  export function bodyPose(): BodyPose;
}

export default ml5;