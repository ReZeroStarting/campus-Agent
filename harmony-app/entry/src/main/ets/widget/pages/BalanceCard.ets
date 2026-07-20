// 校园搭子 - 一卡通余额卡片
@Entry
@Component
struct BalanceCard {
  @LocalStorageProp('balAmount') amount: string = '128.50';
  @LocalStorageProp('balWeekSpent') weekSpent: string = '67';
  @LocalStorageProp('balLow') low: string = 'false';

  build() {
    Stack() {
      Column() {
        Row() {
          Text('💳').fontSize(16)
          Text('一卡通').fontSize(11).fontWeight(600).fontColor('#1a1a2e').margin({ left: 4 })
          Blank()
        }.width('100%').margin({ bottom: 4 })

        Row() {
          Text('¥')
            .fontSize(14).fontColor(this.low === 'true' ? '#EF4444' : '#1E7AFC')
            .margin({ bottom: 8 })
          Text(this.amount)
            .fontSize(26).fontWeight(800)
            .fontColor(this.low === 'true' ? '#EF4444' : '#1E7AFC')
        }

        Text(`本周消费 ¥${this.weekSpent}`).fontSize(10).fontColor('#8899bb').margin({ top: 2 })

        if (this.low === 'true') {
          Text('⚠️ 余额不足').fontSize(10).fontColor('#EF4444').margin({ top: 2 })
        }
      }
      .width('100%').height('100%').padding(10)
      .borderRadius(12).backgroundColor('#fff')
      .border({ width: 1, color: this.low === 'true' ? '#FCA5A5' : '#E5E7EB' })
      .shadow({ radius: 4, color: 'rgba(0,0,0,0.04)', offsetY: 2 })
    }
    .width('100%').height('100%')
  }
}
