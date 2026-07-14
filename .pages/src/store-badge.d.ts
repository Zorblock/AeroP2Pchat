import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ms-store-badge": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        productid: string;
        productname?: string;
        cid?: string;
        "window-mode"?: "direct" | "full";
        theme?: "dark" | "light" | "auto";
        size?: "small" | "medium" | "large";
        animation?: "on" | "off";
        language?: string;
      };
    }
  }
}
