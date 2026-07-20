// 校园搭子 - 个人页面
import router from '@ohos.router';

@Entry
@Component
struct Profile {
  build() {
    Column() {
      Row() {
        Button() { Image($r('sys.symbol.chevron_left')).width(20).height(20) }
          .width(36).height(36).backgroundColor(Color.Transparent)
          .onClick(() => router.back())
        Text('我的').fontSize(18).fontWeight(600).margin({ left: 8 })
        Blank()
      }
      .width('100%').height(52).padding({ left: 12, right: 16 })
      .backgroundColor('#1E7AFC')

      Column() {
        Text('🎒').fontSize(56).margin({ bottom: 8 })
        Text('校园搭子').fontSize(20).fontWeight(700).fontColor('#1a1a2e')
        Text('Campus Buddy v1.0.0').fontSize(12).fontColor('#8899bb').margin({ top: 4, bottom: 4 })
        Text('基于三层记忆模型的校园 AI 助手').fontSize(12).fontColor('#667799')
        Text('鸿蒙高校创新赛 · Agent 赛道').fontSize(11).fontColor('#8899bb').margin({ top: 20 })

        Divider().margin({ top: 24, bottom: 24 }).width('80%')

        Text('能力一览').fontSize(14).fontWeight(600).fontColor('#1a1a2e').margin({ bottom: 12 })
        Grid() {
          GridItem() { this.FeatItem('⚡', '<1ms', '意图识别') }
          GridItem() { this.FeatItem('🎯', '12', '场景覆盖') }
          GridItem() { this.FeatItem('🧠', '3层', '记忆模型') }
          GridItem() { this.FeatItem('🛡️', '3层', '降级保障') }
          GridItem() { this.FeatItem('📚', 'RAG', '知识库') }
          GridItem() { this.FeatItem('💾', '真实', '数据导入') }
        }
        .columnsTemplate('1fr 1fr 1fr')
        .rowsGap(12).columnsGap(12)
        .width('80%')
      }
      .layoutWeight(1).width('100%')
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)
    }
    .width('100%').height('100%').backgroundColor('#fff')
  }

  @Builder FeatItem(icon: string, value: string, label: string) {
    Column() {
      Text(icon).fontSize(20)
      Text(value).fontSize(18).fontWeight(700).fontColor('#1E7AFC').margin({ top: 2 })
      Text(label).fontSize(11).fontColor('#8899bb').margin({ top: 2 })
    }
    .padding({ top: 12, bottom: 12 })
    .borderRadius(12)
    .backgroundColor('#f8faff')
  }
}
