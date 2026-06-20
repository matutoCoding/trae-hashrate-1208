export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/recommend/index',
    'pages/orders/index',
    'pages/profile/index',
    'pages/teacher-detail/index',
    'pages/publish-order/index',
    'pages/weight-config/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '优师派',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#5B8FF9',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/recommend/index',
        text: '推荐'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
