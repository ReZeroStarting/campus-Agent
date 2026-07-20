// 校园搭子 - 主页面（带底部导航栏）
import { CampusAgent } from '../common/CampusAgent';
import { MemoryStore } from '../common/MemoryStore';
import { HttpClient } from '../common/HttpClient';
import type { Message, AgentResponse, CardData, SceneMessages } from '../model/Types';

@Entry
@Component
struct Index {
  // Tabs 状态
  @State currentIndex: number = 0;
  private tabsController: TabsController = new TabsController();

  // 对话页状态
  @State messages: Message[] = [];
  @State inputText: string = '';
  @State isLoading: boolean = false;
  @State suggestions: string[] = [
    '早安', '我要洗澡', '明天什么课', '找空教室', '有哪些快递', '绩点'
  ];
  private agent: CampusAgent = CampusAgent.getInstance();
  private scroller: Scroller = new Scroller();

  // 设置页状态
  @State schoolName: string = '';
  @State scheduleImported: boolean = false;
  @State gradeImported: boolean = false;
  @State apiStatus: string = '检测中…';
  private store = MemoryStore.getInstance();

  aboutToAppear(): void {
    // 从卡片/小艺跳转过来的场景参数
    const scene = AppStorage.get<string>('launchScene') || '';
    if (scene) {
      this.sendQuickScene(scene);
      AppStorage.setOrCreate('launchScene', '');
    }
    // 加载设置
    this.loadSettings();
  }

  // ── 对话页逻辑 ──
  async sendQuickScene(scene: string): Promise<void> {
    const messages: SceneMessages = {
      shower: '我要洗澡', schedule: '今天课表', card: '一卡通余额',
      weather: '今天天气', water: '喝了多少水', delivery: '查快递',
      forum: '论坛首页', map: '校园地图', exam: '考试倒计时',
      classroom: '找空教室', grade: '绩点', morning_brief: '早安'
    };
    let msg: string = scene;
    switch (scene) {
      case 'shower': msg = messages.shower; break;
      case 'schedule': msg = messages.schedule; break;
      case 'card': msg = messages.card; break;
      case 'weather': msg = messages.weather; break;
      case 'water': msg = messages.water; break;
      case 'delivery': msg = messages.delivery; break;
      case 'forum': msg = messages.forum; break;
      case 'map': msg = messages.map; break;
      case 'exam': msg = messages.exam; break;
      case 'classroom': msg = messages.classroom; break;
      case 'grade': msg = messages.grade; break;
      case 'morning_brief': msg = messages.morning_brief; break;
    }
    this.inputText = msg;
    await this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: Date.now()
    } as Message;
    this.messages = [...this.messages, userMsg];
    this.inputText = '';
    this.isLoading = true;
    this.scrollToBottom();

    const resp: AgentResponse = await this.agent.sendMessage(text);

    const agentMsg: Message = {
      id: `msg_${Date.now() + 1}`,
      role: 'agent',
      text: resp.text,
      timestamp: Date.now(),
      card: resp.card
    } as Message;
    this.messages = [...this.messages, agentMsg];
    this.suggestions = resp.suggestions.length > 0 ? resp.suggestions : this.suggestions;
    this.isLoading = false;
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout((): void => { this.scroller.scrollEdge(Edge.Bottom); }, 100);
  }

  // ── 设置页逻辑 ──
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
    Tabs({ barPosition: BarPosition.End, controller: this.tabsController }) {
      // Tab 1: 对话页
      TabContent() {
        this.ChatPage()
      }
      .tabBar(this.TabBuilder(0, '💬', '对话'))

      // Tab 2: 设置页
      TabContent() {
        this.SettingsPage()
      }
      .tabBar(this.TabBuilder(1, '⚙️', '设置'))

      // Tab 3: 我的页
      TabContent() {
        this.ProfilePage()
      }
      .tabBar(this.TabBuilder(2, '👤', '我的'))
    }
    .barHeight(56)
    .barBackgroundColor('#ffffff')
    .onChange((index: number) => {
      this.currentIndex = index;
    })
    .width('100%')
    .height('100%')
  }

  // 底部导航栏项
  @Builder TabBuilder(index: number, icon: string, label: string) {
    Column() {
      Text(icon)
        .fontSize(24)
        .opacity(this.currentIndex === index ? 1.0 : 0.5)
      Text(label)
        .fontSize(12)
        .fontColor(this.currentIndex === index ? '#1E7AFC' : '#8899bb')
        .margin({ top: 4 })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }

  // ── 对话页内容 ──
  @Builder ChatPage() {
    Column() {
      // 顶部栏
      Row() {
        Text('校园搭子').fontSize(18).fontWeight(600).fontColor('#fff')
        Blank()
        Text('🤖').fontSize(20)
      }
      .width('100%').height(52).padding({ left: 16, right: 16 })
      .backgroundColor('#1E7AFC')

      // 消息列表或欢迎视图
      if (this.messages.length === 0) {
        this.WelcomeView()
      } else {
        this.MessageList()
      }

      // 快捷建议
      if (this.messages.length === 0) {
        this.SuggestionsBar()
      }

      // 输入栏
      this.InputBar()
    }
    .width('100%').height('100%').backgroundColor('#f5f7fa')
  }

  @Builder WelcomeView() {
    Column() {
      Text('👋').fontSize(48).margin({ bottom: 16 })
      Text('你好，我是校园搭子').fontSize(20).fontWeight(600).fontColor('#1a1a2e')
      Text('课表、绩点、快递、空教室…问我都知道').fontSize(14).fontColor('#667799').margin({ top: 8 })
    }
    .layoutWeight(1).width('100%')
    .justifyContent(FlexAlign.Center)
  }

  @Builder MessageList() {
    List({ scroller: this.scroller }) {
      ForEach(this.messages, (msg: Message) => {
        ListItem() {
          this.MessageBubble(msg)
        }
      }, (msg: Message) => msg.id)
    }
    .layoutWeight(1).width('100%')
    .padding({ left: 12, right: 12, top: 8, bottom: 8 })
  }

  @Builder MessageBubble(msg: Message) {
    Row() {
      if (msg.role === 'user') {
        Blank()
        Column() {
          Text(msg.text).fontSize(15).fontColor('#fff').padding(12)
        }
        .backgroundColor('#1E7AFC').borderRadius({ topLeft: 16, topRight: 4, bottomLeft: 16, bottomRight: 16 })
        .constraintSize({ maxWidth: '75%' })
      } else {
        Column() {
          Text(msg.text).fontSize(15).fontColor('#1a1a2e').padding(12)
          if (msg.card) {
            this.CardView(msg.card)
          }
        }
        .backgroundColor('#fff').borderRadius({ topLeft: 4, topRight: 16, bottomLeft: 16, bottomRight: 16 })
        .constraintSize({ maxWidth: '85%' })
        .alignItems(HorizontalAlign.Start)
        Blank()
      }
    }
    .width('100%').margin({ top: 8, bottom: 8 })
  }

  @Builder CardView(card: CardData) {
    Column() {
      if (card.title) {
        Row() {
          Text(card.icon || '📊').fontSize(16)
          Text(card.title).fontSize(14).fontWeight(600).margin({ left: 6 })
        }
        .padding({ left: 12, right: 12, top: 8, bottom: 4 })
      }
      if (card.items && card.items.length > 0) {
        ForEach(card.items, (item: string) => {
          Text(item).fontSize(13).fontColor('#556677').padding({ left: 12, right: 12, top: 2, bottom: 2 })
        })
      }
    }
    .width('100%')
    .backgroundColor('#f8faff')
    .borderRadius(8)
    .margin({ top: 8, left: 12, right: 12, bottom: 8 })
  }

  @Builder SuggestionsBar() {
    Flex({ wrap: FlexWrap.Wrap }) {
      ForEach(this.suggestions, (sug: string) => {
        Button(sug)
          .fontSize(13).height(32)
          .backgroundColor('#fff').fontColor('#1E7AFC')
          .borderRadius(16)
          .margin({ left: 4, right: 4, top: 4, bottom: 4 })
          .onClick(async () => {
            this.inputText = sug;
            await this.sendMessage();
          })
      })
    }
    .width('100%').padding({ left: 12, right: 12, top: 8, bottom: 8 })
    .backgroundColor('#f0f4f8')
  }

  @Builder InputBar() {
    Row() {
      TextInput({ placeholder: '问我任何校园问题…', text: $$this.inputText })
        .layoutWeight(1).height(40)
        .borderRadius(20).backgroundColor('#fff')
        .padding({ left: 16, right: 16 })
        .onSubmit(async () => { await this.sendMessage(); })

      Button() {
        if (this.isLoading) {
          LoadingProgress().width(20).height(20).color('#fff')
        } else {
          Text('➤').fontSize(18).fontColor('#fff')
        }
      }
      .width(44).height(44).borderRadius(22)
      .backgroundColor(this.isLoading ? '#88aacc' : '#1E7AFC')
      .margin({ left: 8 })
      .enabled(!this.isLoading)
      .onClick(async () => { await this.sendMessage(); })
    }
    .width('100%').padding({ left: 12, right: 12, top: 8, bottom: 8 })
    .backgroundColor('#fff')
  }

  // ── 设置页内容 ──
  @Builder SettingsPage() {
    Column() {
      // 顶部栏
      Row() {
        Text('设置').fontSize(18).fontWeight(600).fontColor('#fff')
        Blank()
      }
      .width('100%').height(52).padding({ left: 16, right: 16 })
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

  // ── 我的页内容 ──
  @Builder ProfilePage() {
    Column() {
      // 顶部栏
      Row() {
        Text('我的').fontSize(18).fontWeight(600).fontColor('#fff')
        Blank()
      }
      .width('100%').height(52).padding({ left: 16, right: 16 })
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
