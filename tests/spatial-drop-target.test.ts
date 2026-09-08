import { describe, expect, it } from "vitest";
import { Ray, Vector3 } from "three";
import { findSpatialDropTarget } from "../components/spatial-blocks/spatial-drop-target";

describe("积木轮廓吸附", () => {
  const second = { x: -1, y: 2, z: 0 };
  it("第二层轮廓边缘可以吸附，同一落点重复检测不丢失", () => {
    const ray = new Ray(new Vector3(-0.4, 2.5, 10), new Vector3(0, 0, -1));
    expect(findSpatialDropTarget(ray, [second])).toEqual(second);
    expect(findSpatialDropTarget(ray, [second])).toEqual(second);
  });
  it("不把远离轮廓或未开放的位置吸附成目标", () => {
    const ray = new Ray(new Vector3(1, 2.5, 10), new Vector3(0, 0, -1));
    expect(findSpatialDropTarget(ray, [second])).toBeUndefined();
    expect(findSpatialDropTarget(ray, [])).toBeUndefined();
  });
  it("转动后从侧面仍能吸附，重叠投影选择近处", () => {
    const ray = new Ray(new Vector3(10, 2.5, 0), new Vector3(-1, 0, 0));
    expect(findSpatialDropTarget(ray, [second])).toEqual(second);
    const nearer = { x: 1, y: 2, z: 0 };
    expect(findSpatialDropTarget(ray, [second, nearer])).toEqual(nearer);
  });
});
