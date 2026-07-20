// 校园搭子 - 可视化测试页面
// 运行：模拟器打开后，直接展示所有测试结果
import { CampusAgent } from '../../main/ets/common/CampusAgent';

interface TestCase {
  name: string
  input: string
  assert: (resp: string) => boolean
}

interface TestResult {
  name: string
  pass: boolean
  detail: string
}

@Entry
@Component
struct TestPage {
  @State results: TestResult[] = [];
  @State totalPass: number = 0;
  @State totalFail: number = 0;
  @State running: boolean = false;
  private agent: CampusAgent = CampusAgent.getInstance();

  // ── 测试用例定义 ──
  private tests: TestCase[] = [
    // === 意图匹配测试 ===
    { name: '洗澡意图',          input: '我要洗澡',       assert: r => r.includes('洗澡') || r.includes('余额') || r.includes('🚿') },
    { name: '洗澡口语化',        input: '冲凉',           assert: r => r.includes('洗澡') || r.includes('余额') },
    { name: '课表今天',          input: '今天什么课',     assert: r => r.includes('课表') || r.includes('📅') },
    { name: '课表明天',          input: '明天有什么课',   assert: r => r.includes('课表') || r.includes('📅') },
    { name: '一卡通余额',        input: '卡里还有多少钱', assert: r => r.includes('余额') || r.includes('💳') },
    { name: '天气查询',          input: '今天天气',       assert: r => r.includes('天气') || r.includes('°C') },
    { name: '天气穿衣',          input: '穿什么',         assert: r => r.includes('天气') || r.includes('穿') || r.includes('°C') },
    { name: '饮水查询',          input: '今天喝了多少水', assert: r => r.includes('饮水') || r.includes('ml') },
    { name: '饮水记录',          input: '记录喝水200ml',  assert: r => r.includes('饮水') || r.includes('ml') },
    { name: '快递查询',          input: '查快递',         assert: r => r.includes('快递') || r.includes('📦') },
    { name: '取件码',            input: '取件码是多少',   assert: r => r.includes('快递') || r.includes('取件') },
    { name: '外卖查询',          input: '外卖到了吗',     assert: r => r.includes('外卖') || r.includes('快递') },
    { name: '校园地图',          input: '教三在哪',       assert: r => r.includes('地图') || r.includes('教') || r.includes('🗺️') },
    { name: '导航建筑',          input: '图书馆怎么走',   assert: r => r.includes('地图') || r.includes('图书馆') },
    { name: '考试倒计时',        input: '考试倒计时',     assert: r => r.includes('考试') || r.includes('📝') },
    { name: '期末考试',          input: '期末考试什么时候', assert: r => r.includes('考试') || r.includes('📝') },
    { name: '空教室',            input: '找空教室',       assert: r => r.includes('教室') || r.includes('🏫') },
    { name: '设施筛选',          input: '找个有插座的',   assert: r => r.includes('教室') || r.includes('插座') },
    { name: '绩点查询',          input: '绩点多少',       assert: r => r.includes('GPA') || r.includes('绩点') },
    { name: '挂科检查',          input: '有没有挂科',     assert: r => r.includes('GPA') || r.includes('挂科') || r.includes('绩点') },
    { name: '智能早报',          input: '早安',           assert: r => r.includes('早报') || r.includes('天气') || r.includes('🌅') },
    { name: '早报问候',          input: '早上好',         assert: r => r.includes('早报') || r.includes('天气') || r.includes('🌅') },

    // === 降级测试（无网络情况下仍能响应）===
    { name: '离线降级_模糊',     input: '今天几号',       assert: r => r.includes('抱歉') || r.length > 10 },
    { name: '离线降级_游戏',     input: '我们玩个游戏吧', assert: r => r.includes('抱歉') || r.length > 5 },

    // === 响应结构测试 ===
    { name: '响应结构_文本非空', input: '早安',           assert: r => r.length > 10 },
    { name: '响应结构_有建议',   input: '今天课表',       assert: r => r.length > 20 },
  ];

  aboutToAppear() {
    this.runAllTests();
  }

  async runAllTests() {
    this.running = true;
    this.results = [];
    let pass = 0, fail = 0;

    for (const test of this.tests) {
      try {
        const resp = await this.agent.sendMessage(test.input);
        const ok = test.assert(resp.text);
        if (ok) pass++; else fail++;
        this.results = [...this.results, {
          name: test.name,
          pass: ok,
          detail: ok ? resp.text.slice(0, 60) + '…' : `期望命中，实际: ${resp.text.slice(0, 40)}`
        }];
      } catch (e) {
        fail++;
        this.results = [...this.results, {
          name: test.name, pass: false, detail: `异常: ${JSON.stringify(e)}`
        }];
      }
    }

    this.totalPass = pass;
    this.totalFail = fail;
    this.running = false;
  }

  build() {
    Column() {
      // 顶栏
      Row() {
        Text('🧪').fontSize(22)
        Text('端侧引擎测试').fontSize(18).fontWeight(700).fontColor('#fff').margin({ left: 8 })
        Blank()
        Text(`${this.tests.length}用例`).fontSize(11).fontColor('rgba(255,255,255,0.7)')
      }
      .width('100%').height(52).padding({ left: 16, right: 16 })
      .backgroundColor('#1E7AFC')

      // 汇总
      Row() {
        Column() {
          Text(`${this.totalPass}`).fontSize(32).fontWeight(800).fontColor('#10B981')
          Text('通过').fontSize(11).fontColor('#667799')
        }.flex(1)
        Column() {
          Text(`${this.totalFail}`).fontSize(32).fontWeight(800).fontColor('#EF4444')
          Text('失败').fontSize(11).fontColor('#667799')
        }.flex(1)
        Column() {
          Text(this.totalPass + this.totalFail > 0
            ? `${Math.round(this.totalPass / (this.totalPass + this.totalFail) * 100)}%`
            : '—').fontSize(32).fontWeight(800).fontColor('#1E7AFC')
          Text('通过率').fontSize(11).fontColor('#667799')
        }.flex(1)
      }
      .width('100%').padding({ top: 16, bottom: 12, left: 24, right: 24 })
      .backgroundColor('#f0f4f8')

      // 测试列表
      if (this.running) {
        Column() {
          LoadingProgress().width(24).height(24).color('#1E7AFC')
          Text('正在运行…').fontSize(13).fontColor('#667799').margin({ top: 8 })
        }.layoutWeight(1).justifyContent(FlexAlign.Center)
      } else {
        List() {
          ForEach(this.results, (r: TestResult, idx: number) => {
            ListItem() {
              Row() {
                Text(r.pass ? '✅' : '❌').fontSize(14).margin({ right: 8 })
                Column() {
                  Text(r.name).fontSize(13).fontWeight(500).fontColor(r.pass ? '#1a1a2e' : '#EF4444')
                  if (!r.pass) {
                    Text(r.detail).fontSize(10).fontColor('#8899bb').maxLines(2).margin({ top: 2 })
                  }
                }.alignItems(HorizontalAlign.Start)
                Blank()
              }
              .width('100%').padding({ left: 16, right: 16, top: 10, bottom: 10 })
            }
          })
        }
        .layoutWeight(1)
        .divider({ strokeWidth: 1, color: '#f0f0f0', startMargin: 16, endMargin: 16 })
      }

      Button('🔄 重新运行')
        .width('100%').height(44).margin({ left: 16, right: 16, bottom: 16, top: 8 })
        .fontSize(14).backgroundColor('#1E7AFC').borderRadius(10)
        .onClick(() => this.runAllTests())
    }
    .width('100%').height('100%').backgroundColor('#fff')
  }
}
