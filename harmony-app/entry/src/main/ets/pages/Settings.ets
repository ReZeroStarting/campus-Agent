// 校园搭子 - 设置页面
import { MemoryStore } from '../common/MemoryStore';
import { HttpClient } from '../common/HttpClient';
import router from '@ohos.router';

@Entry
@Component
struct Settings {
  @State schoolName: string = '';
  @State scheduleImported: boolean = false;
  @State gradeImported: boolean = false;
  @State apiStatus: string = '检测中…';
  private store = MemoryStore.getInstance();

  aboutToAppear(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.schoolName = await this.store.getSchool();
    this.scheduleImported = await this.store.isDataImported('schedule');
    this.gradeImported = await this.store.isDataImported('grade');
  }

  async testConnection(): Promise<void> {
    const resp = await HttpClient.getInstance().getSchedule();
    this.apiStatus = resp ? '✅ 连接正常' : '❌ 连接失败';
  }

  build() {
    Column() {
      Row() {
        Button() { Image($r('sys.symbol.chevron_left')).width(20).height(20) }
          .width(36).height(36).backgroundColor(Color.Transparent)
          .onClick(() => router.back())
        Text('设置').fontSize(18).fontWeight(600).margin({ left: 8 })
        Blank()
      }
      .width('100%').height(52).padding({ left: 12, right: 16 })
      .backgroundColor('#1E7AFC')
      .onAppear(() => this.testConnection())

      List() {
        // 学校设置
        ListItem() {
          Column() {
            Text('🏫 学校').fontSize(14).fontWeight(600).padding({ left: 16, top: 16, bottom: 8 })
            TextInput({ placeholder: '输入学校名称', text: this.schoolName })
              .width('100%').height(44)
              .borderRadius(10).backgroundColor('#f0f4f8')
              .padding({ left: 12 }).margin({ left: 16, right: 16, bottom: 16 })
              .onChange((v: string) => { this.schoolName = v; this.store.setSchool(v); })
          }
        }

        // 数据导入
        ListItem() {
          Column() {
            Text('📥 真实数据导入').fontSize(14).fontWeight(600).padding({ left: 16, top: 16, bottom: 8 })
            Row() {
              Text('课表导入').fontSize(13)
              Blank()
              Text(this.scheduleImported ? '✅ 已导入' : '❌ 未导入')
                .fontSize(12).fontColor(this.scheduleImported ? '#10B981' : '#EF4444')
            }
            .width('100%').padding({ left: 16, right: 16, bottom: 8 })
            Row() {
              Text('成绩单导入').fontSize(13)
              Blank()
              Text(this.gradeImported ? '✅ 已导入' : '❌ 未导入')
                .fontSize(12).fontColor(this.gradeImported ? '#10B981' : '#EF4444')
            }
            .width('100%').padding({ left: 16, right: 16, bottom: 16 })
            Text('支持从教务系统导出 Excel，拖入即导入').fontSize(11).fontColor('#8899bb').padding({ left: 16, bottom: 16 })
          }
        }

        // API 连接
        ListItem() {
          Row() {
            Text('🔗 API 连接状态').fontSize(14)
            Blank()
            Text(this.apiStatus).fontSize(12).fontColor(
              this.apiStatus.includes('正常') ? '#10B981' : '#EF4444'
            )
          }
          .width('100%').padding(16)
        }
      }
      .layoutWeight(1).width('100%')
      .divider({ strokeWidth: 1, color: '#f0f0f0', startMargin: 16, endMargin: 16 })
    }
    .width('100%').height('100%').backgroundColor('#fff')
  }
}
