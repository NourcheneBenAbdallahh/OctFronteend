declare module "*.svg" {
  import type { FC, SVGProps } from "react";

  type SvgIconProps = SVGProps<SVGSVGElement> & {
    title?: string;
    size?: number | string;
  };

  const SvgIcon: FC<SvgIconProps>;
  export default SvgIcon;
}
