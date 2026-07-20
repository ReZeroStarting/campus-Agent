// 校园搭子 - TestAbility
import { UIAbility, Want, AbilityConstant } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class TestAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {}
  onWindowStageCreate(windowStage: window.WindowStage) {
    windowStage.loadContent('testability/TestPage', () => {});
  }
}
