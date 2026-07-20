// 校园搭子 - 今日课表卡片
@Entry
@Component
struct ScheduleCard {
  @LocalStorageProp('schedTitle') title: string = '今日课表';
  @LocalStorageProp('schedMorning') morning: string = '09:50 高数 教三101';
  @LocalStorageProp('schedAfternoon') afternoon: string = '14:00 数据结构 教二201';
  @LocalStorageProp('schedEvening') evening: string = '无晚课 😊';
  @LocalStorageProp('schedCount') count: string = '2节';

  build() {
    Stack() {
      Column() {
        Row() {
          Text('📅').fontSize(18)
          Column() {
            Text(this.title).fontSize(13).fontWeight(600).fontColor('#1a1a2e')
            Text(`${this.count}课`).fontSize(11).fontColor('#1E7AFC')
          }.alignItems(HorizontalAlign.Start).margin({ left: 6 })
          Blank()
        }.width('100%').margin({ bottom: 8 })

        ForEach([this.morning, this.afternoon, this.evening], (line: string) => {
          Row() {
            Circle({ width: 4, height: 4 }).fill(line.includes('无') ? '#10B981' : '#1E7AFC').margin({ right: 6 })
            Text(line).fontSize(11).fontColor(line.includes('无') ? '#10B981' : '#667799').maxLines(1)
          }.width('100%').margin({ bottom: 2 })
        })
      }
      .width('100%').height('100%').padding(10)
      .borderRadius(12).backgroundColor('#fff')
      .shadow({ radius: 4, color: 'rgba(0,0,0,0.04)', offsetY: 2 })
    }
    .width('100%').height('100%')
  }
}
