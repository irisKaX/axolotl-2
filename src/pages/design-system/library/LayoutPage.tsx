import { DesignSystemProvider } from "../../../design-system/library";
import { useDesignSystem } from "../../../design-system/library/Provider";
import { LayoutStudio } from "./layout/LayoutStudio";
import type { PageProps } from "./model";
export default function LayoutPage({ previewTheme = "dark" }: PageProps) {
  const { reducedMotion } = useDesignSystem();
  return (
    <DesignSystemProvider theme={previewTheme} reducedMotion={reducedMotion}>
      <LayoutStudio />
    </DesignSystemProvider>
  );
}
