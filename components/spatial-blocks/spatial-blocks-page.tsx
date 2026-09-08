import type { ReactNode } from "react";

import { SpatialBlocksExperience } from "./spatial-blocks-experience";
import styles from "./spatial-blocks.module.css";

export function SpatialBlocksPage({ seoContent }: { seoContent: ReactNode }) {
  return (
    <div className={styles.page}>
      <SpatialBlocksExperience />
      <div className={styles.seo}>{seoContent}</div>
    </div>
  );
}
