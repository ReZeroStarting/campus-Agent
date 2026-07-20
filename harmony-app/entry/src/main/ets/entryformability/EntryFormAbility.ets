// 校园搭子 - 服务卡片 FormAbility
import { formInfo, formBindingData, FormExtensionAbility, formProvider } from '@kit.FormKit';
import { Want } from '@kit.AbilityKit';
import { CampusAgent } from '../common/CampusAgent';
import type { Exam, Course } from '../model/Types';
import { HttpClient } from '../common/HttpClient';

export default class EntryFormAbility extends FormExtensionAbility {
  onAddForm(want: Want): formBindingData.FormBindingData {
    return this.createDefaultData();
  }

  onUpdateForm(formId: string): void {
    this.updateCardData(formId);
  }

  async onFormEvent(formId: string, message: string): Promise<void> {
    // 点击卡片 → 打开对应场景
    const params: Record<string, string> = JSON.parse(message) as Record<string, string>;
    const scene: string = params['scene'] || '';
    // 触发主 Ability 跳转
  }

  private createDefaultData(): formBindingData.FormBindingData {
    return formBindingData.createFormBindingData({
      schedTitle: '加载中…',
      schedMorning: '正在获取课表…',
      schedAfternoon: '',
      schedEvening: '',
      schedCount: '—',
      examName: '加载中…',
      examDays: '—',
      examDate: '',
      examRoom: '',
      examUrgent: 'false',
      balAmount: '—',
      balWeekSpent: '—',
      balLow: 'false',
      pkgCount: '—',
      pkgLatest: '加载中…',
      pkgCode: '',
      pkgHasNew: 'false',
      morningData: '正在获取早报…',
    });
  }

  private async updateCardData(formId: string): Promise<void> {
    const http = HttpClient.getInstance();
    const data: Record<string, string> = {};

    // 课表卡片
    try {
      const sched = await http.getSchedule();
      if (sched?.courses?.length) {
        const today = sched.courses.filter(c => c.dayOfWeek === new Date().getDay());
        data['schedTitle'] = '今日课表';
        data['schedMorning'] = today[0] ? `${today[0].time?.split('-')[0] || ''} ${today[0].name} ${today[0].room}` : '上午没课';
        data['schedAfternoon'] = today[1] ? `${today[1].time?.split('-')[0] || ''} ${today[1].name} ${today[1].room}` : '下午没课';
        data['schedEvening'] = today.length <= 2 ? '无晚课 😊' : `${today[2]?.name || ''} ${today[2]?.room || ''}`;
        data['schedCount'] = `${today.length}节`;
      }
    } catch (_) {}

    // 考试卡片
    try {
      const exams = await http.getExams();
      if (exams?.exams?.length) {
        const next = exams.exams[0];
        data['examName'] = next.courseName;
        data['examDays'] = `${next.daysLeft}`;
        data['examDate'] = next.date;
        data['examRoom'] = next.room;
        data['examUrgent'] = next.daysLeft <= 3 ? 'true' : 'false';
      }
    } catch (_) {}

    // 余额卡片
    try {
      const card = await http.getCard();
      if (card) {
        data['balAmount'] = card.balance.toFixed(2);
        data['balLow'] = card.balance < 20 ? 'true' : 'false';
      }
    } catch (_) {}

    // 快递卡片
    try {
      const delivery = await http.getDelivery();
      if (delivery?.packages?.length) {
        const newPkgs = delivery.packages.filter(p => p.arrived);
        data['pkgCount'] = `${delivery.packages.length}`;
        data['pkgLatest'] = `${delivery.packages[0].company} · ${delivery.packages[0].pickupPoint}`;
        data['pkgCode'] = delivery.packages[0].pickupCode;
        data['pkgHasNew'] = newPkgs.length > 0 ? 'true' : 'false';
      }
    } catch (_) {}

    // 早报卡片
    try {
      const brief = await http.getMorningBrief();
      if (brief) data['morningData'] = brief.text;
    } catch (_) {}

    const formData = formBindingData.createFormBindingData(data);
    formProvider.updateForm(formId, formData);
  }
}
