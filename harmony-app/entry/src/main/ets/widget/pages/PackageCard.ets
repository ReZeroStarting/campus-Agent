// 校园搭子 - 快递提醒卡片
@Entry
@Component
struct PackageCard {
  @LocalStorageProp('pkgCount') count: string = '2';
  @LocalStorageProp('pkgLatest') latest: string = '中通 · 西区驿站';
  @LocalStorageProp('pkgCode') code: string = '3-2-1088';
  @LocalStorageProp('pkgHasNew') hasNew: string = 'true';

  build() {
    Stack() {
      Column() {
        Row() {
          Text('📦').fontSize(16)
          Text(`快递 (${this.count})`)
            .fontSize(12).fontWeight(600).fontColor('#1a1a2e').margin({ left: 4 })
          Blank()
          if (this.hasNew === 'true') {
            Circle({ width: 6, height: 6 }).fill('#EF4444')
          }
        }.width('100%').margin({ bottom: 6 })

        Text(this.latest).fontSize(11).fontColor('#667799').maxLines(1).margin({ bottom: 2 })
        Text(`取件码 ${this.code}`)
          .fontSize(16).fontWeight(700).fontColor('#1E7AFC')
          .fontFamily('monospace')

        if (this.hasNew === 'true') {
          Text('📩 有新快递到站').fontSize(10).fontColor('#EF4444').margin({ top: 4 })
        }
      }
      .width('100%').height('100%').padding(10)
      .borderRadius(12).backgroundColor('#fff')
      .shadow({ radius: 4, color: 'rgba(0,0,0,0.04)', offsetY: 2 })
    }
    .width('100%').height('100%')
  }
}
