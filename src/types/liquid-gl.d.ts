declare module "liquid-gl" {
  export type LiquidGLReveal = "fade" | "none";

  export type LiquidGLInstance = {
    setShadow(enabled: boolean): void;
    setTilt(enabled: boolean): void;
    updateMetrics(): void;
  };

  export type LiquidGLOptions = {
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    magnify?: number;
    on?: {
      init?: (instance: LiquidGLInstance) => void;
    };
    refraction?: number;
    resolution?: number;
    reveal?: LiquidGLReveal;
    shadow?: boolean;
    snapshot?: string;
    specular?: boolean;
    target: string;
    tilt?: boolean;
    tiltEase?: number;
    tiltFactor?: number;
  };

  type DynamicElements = string | Element[];

  type LiquidGL = {
    (options: LiquidGLOptions):
      | LiquidGLInstance
      | LiquidGLInstance[]
      | Element
      | Element[]
      | undefined;
    registerDynamic(elements: DynamicElements): void;
    syncWith(config?: Record<string, unknown>): unknown;
  };

  const liquidGL: LiquidGL;

  export default liquidGL;
}
