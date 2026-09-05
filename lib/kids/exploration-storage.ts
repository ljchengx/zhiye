import {
  clearKidsExploration,
  KIDS_EXPLORATION_STORAGE_KEY,
  parseKidsExploration,
  recordKidsExploration,
  selectKidsExploration,
  serializeKidsExploration,
  type KidsExplorationEvent,
  type KidsExplorationV1,
} from "./exploration";

export interface KidsExplorationRepository {
  load(childId: string): Promise<KidsExplorationV1>;
  // 互动页面只提交当前孩子的操作，正式接入服务端时可沿用同一归属边界。
  record(event: KidsExplorationEvent): Promise<KidsExplorationV1>;
  clear(childId: string, activityId?: string): Promise<KidsExplorationV1>;
}

export function loadKidsExplorationFromStorage(storage: Storage): KidsExplorationV1 {
  return parseKidsExploration(storage.getItem(KIDS_EXPLORATION_STORAGE_KEY));
}

function saveKidsExplorationToStorage(storage: Storage, exploration: KidsExplorationV1): void {
  storage.setItem(KIDS_EXPLORATION_STORAGE_KEY, serializeKidsExploration(exploration));
}

export function createLocalKidsExplorationRepository(getStorage: () => Storage): KidsExplorationRepository {
  return {
    load: async (childId) => selectKidsExploration(loadKidsExplorationFromStorage(getStorage()), childId),
    record: async (event) => {
      const storage = getStorage();
      const next = recordKidsExploration(loadKidsExplorationFromStorage(storage), event);
      saveKidsExplorationToStorage(storage, next);
      return selectKidsExploration(next, event.childId);
    },
    clear: async (childId, activityId) => {
      const storage = getStorage();
      const next = clearKidsExploration(loadKidsExplorationFromStorage(storage), childId, activityId);
      saveKidsExplorationToStorage(storage, next);
      return selectKidsExploration(next, childId);
    },
  };
}
