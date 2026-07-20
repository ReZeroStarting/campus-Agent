// 校园搭子 - 智能早报卡片
@Entry
@Component
struct MorningBriefCard {
  @LocalStorageProp('morningData') morningData: string = '🌤️ 25°C~32°C 晴\n📅 今天没有课\n📝 高数还剩3天\n📦 2个快递待取';

  build() {
    Stack() {
      Column() {
        Row() {
          Text('🌅').fontSize(16)
          Text('智能早报').fontSize(13).fontWeight(600).fontColor('#1E7AFC').margin({ left: 4 })
          Blank()
          Text('周日').fontSize(11).fontColor('#8899bb')
        }
        .width('100%').margin({ bottom: 6 })

        Text(this.morningData)
          .fontSize(11).fontColor('#667799').lineHeight(18)
          .maxLines(4).textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .width('100%').height('100%')
      .padding(10)
      .borderRadius(12)
      .backgroundColor('#fff')
      .shadow({ radius: 4, color: 'rgba(0,0,0,0.04)', offsetY: 2 })

      // 右上角渐变装饰
      Circle({ width: 40, height: 40 })
        .fill('linear-gradient(135deg, rgba(30,122,252,0.08), rgba(0,180,216,0.04))')
        .position({ x: '100%', y: 0 })
        .translate({ x: -10, y: 10 })
    }
    .width('100%').height('100%')
  }
}
