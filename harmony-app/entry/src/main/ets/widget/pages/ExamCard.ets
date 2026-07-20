// 校园搭子 - 考试倒计时卡片
@Entry
@Component
struct ExamCard {
  @LocalStorageProp('examName') name: string = '高等数学（下）';
  @LocalStorageProp('examDays') days: string = '3';
  @LocalStorageProp('examDate') date: string = '7月22日';
  @LocalStorageProp('examRoom') room: string = '教一101';
  @LocalStorageProp('examUrgent') urgent: string = 'true';

  build() {
    Stack() {
      Column() {
        Row() {
          Text('📝').fontSize(16)
          Text('考试倒计时').fontSize(11).fontWeight(600).fontColor('#F59E0B').margin({ left: 4 })
          Blank()
        }.width('100%').margin({ bottom: 6 })

        Row() {
          Text(this.days)
            .fontSize(32).fontWeight(800)
            .fontColor(this.urgent === 'true' ? '#EF4444' : '#F59E0B')
          Text('天')
            .fontSize(14).fontColor('#667799').margin({ left: 2, bottom: 4 })
        }

        Text(`${this.name}`).fontSize(12).fontWeight(600).fontColor('#1a1a2e').margin({ top: 4 }).maxLines(1)
        Text(`${this.date} · ${this.room}`).fontSize(10).fontColor('#8899bb').margin({ top: 2 })
      }
      .width('100%').height('100%').padding(10)
      .borderRadius(12).backgroundColor('#FFFBEB')
      .border({ width: 1, color: '#FCD34D' })
      .shadow({ radius: 4, color: 'rgba(0,0,0,0.04)', offsetY: 2 })
    }
    .width('100%').height('100%')
  }
}
