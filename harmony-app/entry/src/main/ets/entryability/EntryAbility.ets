// 校园搭子 - 主入口
import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { MemoryStore } from '../common/MemoryStore';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    // 初始化本地记忆存储
    MemoryStore.getInstance().init(this.context);
    // 解析小艺传入的意图参数
    const scene = want?.parameters?.scene as string || '';
    AppStorage.setOrCreate('launchScene', scene);
  }

  onNewWant(want: Want): void {
    const scene = want?.parameters?.scene as string || '';
    AppStorage.setOrCreate('launchScene', scene);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) console.error('Failed to load content:', JSON.stringify(err));
    });
  }
}
