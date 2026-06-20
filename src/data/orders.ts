import { Order } from '@/types'

export const ordersData: Order[] = [
  {
    id: 'o1',
    teacherId: 't1',
    teacherName: '张明华',
    teacherAvatar: 'https://picsum.photos/id/1005/200/200',
    subject: '数学',
    grade: '高一',
    date: '2026-06-22',
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    price: 360,
    address: '北京市朝阳区望京花园1号楼',
    isMerged: true,
    mergedOrderIds: ['o1', 'o2']
  },
  {
    id: 'o3',
    teacherId: 't2',
    teacherName: '李雪婷',
    teacherAvatar: 'https://picsum.photos/id/1011/200/200',
    subject: '英语',
    grade: '初三',
    date: '2026-06-21',
    startTime: '14:00',
    endTime: '16:00',
    status: 'trial',
    price: 0,
    address: '北京市朝阳区大望路22号'
  },
  {
    id: 'o4',
    teacherId: 't3',
    teacherName: '王建国',
    teacherAvatar: 'https://picsum.photos/id/1012/200/200',
    subject: '语文',
    grade: '高二',
    date: '2026-06-20',
    startTime: '10:00',
    endTime: '12:00',
    status: 'completed',
    price: 440,
    address: '北京市朝阳区双井桥东'
  },
  {
    id: 'o5',
    teacherId: 't4',
    teacherName: '陈思雨',
    teacherAvatar: 'https://picsum.photos/id/1014/200/200',
    subject: '化学',
    grade: '高三',
    date: '2026-06-23',
    startTime: '19:00',
    endTime: '21:00',
    status: 'pending',
    price: 320,
    address: '北京市海淀区华清嘉园'
  },
  {
    id: 'o6',
    teacherId: 't5',
    teacherName: '刘芳',
    teacherAvatar: 'https://picsum.photos/id/1027/200/200',
    subject: '英语',
    grade: '五年级',
    date: '2026-06-18',
    startTime: '15:00',
    endTime: '17:00',
    status: 'cancelled',
    price: 260,
    address: '北京市朝阳区望京SOHO T3'
  }
]
