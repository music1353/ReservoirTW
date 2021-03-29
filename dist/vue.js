new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  mounted() {
    this.getTaiwanMap();
    this.getWaterData();
  },
  data: {
    h1: '縣市中文',
    h2: '縣市英文',

    // reservoir data
    locationData: {
      '臺北市': ['翡翠水庫'],
      '新北市': ['翡翠水庫', '石門水庫'],
      '基隆市': ['新山水庫'],
      '桃園市': ['石門水庫'],
      '新竹市': ['石門水庫', '永和山水庫', '寶山水庫', '寶山第二水庫'],
      '新竹縣': ['石門水庫', '永和山水庫', '寶山水庫', '寶山第二水庫'],
      '苗栗縣': ['永和山水庫', '明德水庫', '鯉魚潭水庫'],
      '臺中市': ['鯉魚潭水庫', '德基水庫', '石岡壩'],
      '彰化縣': ['湖山水庫'],
      '南投縣': ['日月潭水庫', '霧社水庫'],
      '雲林縣': ['湖山水庫'],
      '嘉義市': ['湖山水庫', '仁義潭水庫', '曾文水庫'],
      '嘉義縣': ['湖山水庫', '仁義潭水庫', '曾文水庫'],
      '臺南市': ['白河水庫', '曾文水庫', '烏山頭水庫', '南化水庫'],
      '高雄市': ['南化水庫', '阿公店水庫'],
      '屏東縣': ['牡丹水庫']
    },
    waterData: [],
    
    // Reservoir Data
    locationName: '',
    reservoirData: [],
  },
  methods: {
    async getTaiwanMap() {
      const width = (this.$refs.map.offsetWidth).toFixed(),
            height = (this.$refs.map.offsetHeight).toFixed();

      // 判斷螢幕寬度，給不同放大值
      let mercatorScale, w = window.screen.width;
      if(w > 1366) {
        mercatorScale = 11000;
      }
      else if(w <= 1366 && w > 480) {
        mercatorScale = 9000;
      }
      else {
        mercatorScale = 6000;
      }

      // d3：svg path 產生器
      var path = await d3.geo.path().projection(
        // !important 座標變換函式
        d3.geo
          .mercator()
          .center([121,24])
          .scale(mercatorScale)
          .translate([width/2, height/2.5])
      );
      
      // 讓d3抓svg，並寫入寬高
      var svg = await d3.select('#svg')
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`);
      
      // 讓d3抓GeoJSON檔，並寫入path的路徑
      var url = 'dist/taiwan.geojson';
      await d3.json(url, (error, geometry) => {
        if (error) throw error;

        svg
          .selectAll('path')
          .data(geometry.features)
          .enter().append('path')
          .attr('d', path)
          .attr({
            // 設定id，為了click時加class用
            id: (d) => 'city' + d.properties.COUNTYCODE
          })
          .on('click', d => {
            this.locationName = d.properties.COUNTYNAME;
            this.setReservoirData();

            // 有 .active 存在，就移除 .active
            if(document.querySelector('.active')) {
              document.querySelector('.active').classList.remove('active');
            }

            // 被點擊的縣市加上 .active
            document.getElementById('city' + d.properties.COUNTYCODE).classList.add('active');
          });
      });
      return svg;
    },

    /* func */
    setReservoirData() {
      new WOW().init();
      
      if (!Object.keys(this.locationData).includes(this.locationName)) {
        this.reservoirData = [];
        return
      }
      
      let reservoirs = this.locationData[this.locationName];
      this.reservoirData = [];
      reservoirs.forEach(item => {
        this.reservoirData.push(this.waterData[item]);
      });
    },

    /* water style */
    waterStyle(percentage) {
      let pert = percentage.toFixed(0);

      let width = parseInt(pert) + 1 * 300 * 1.5;
      let top = 80 - parseInt(pert)*0.6;
      let color = '';

      if (pert < 50) {
        top += 15;
      }

      if (pert == 0) {
        width = 0;
        top = 0;
      }

      if (pert >= 1 && pert <= 30) {
        color = '#FF80AB';
      } else if (pert > 30 && pert <= 60) {
        color = '#FFA000';
      } else if (pert > 60) {
        color = 'rgb(23, 139, 202)';
      }


      let style =  `
        position: absolute;
        top: ${top}%;
        width: ${width}px !important;
        height: ${width}px !important;
        border-radius: 45%;
        transform-origin: 50% 48%;
        animation: water 5s infinite linear;
        background: ${color} !important;
        z-index: 3;
        transform: translate3d(0, 0, 0);
      `

      return style
    },
    computeRemainDay(volumn, daliyInflow, daliyOverflow) {
      let day = Math.abs(volumn/(daliyInflow - daliyOverflow )).toFixed(0);

      if (day != 'NaN') {  
        return day
      } else {
        return '--'
      }
    },
    remainDayStyle(volumn, daliyInflow, daliyOverflow) {
      let day = Math.abs(volumn/(daliyInflow - daliyOverflow )).toFixed(0);
      let color = 'white'

      if (day!='NaN' && parseInt(day)<20) {  
        color = '#FF80AB';
      }

      let style = `color: ${color} !important;`
      return style
    },

    /* api */
    getWaterData() {
      axios.get('https://www.taiwanstat.com/waters/latest').then(response => {
        let res = response.data[0];
        this.waterData = res;

        // set init
        this.locationName = '新北市';
        this.setReservoirData();
        document.getElementById('city65000').classList.add('active');
      });
    },
  }
});