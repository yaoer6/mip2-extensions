/**
 * @file tab
 * @author zhangjignfeng, convert es module: chenqiushi
 */

/* global $ */

let fn = () => {}
let inter

export default class Tab {
  constructor (panel, options = {}) {
    this.panel = panel
    this.current = options.current || 0 // 当前选中的tab
    this.currentClass = options.currentClass || 'c-tabs-nav-selected'
    this.navWrapperClass = options.navWrapperClass || 'c-tabs-nav'
    this.navClass = options.navClass || 'c-tabs-nav-li'
    this.contClass = options.contClass || 'c-tabs-content'
    this.viewClass = options.viewClass || 'c-tabs-nav-view'
    this.toggleClass = options.toggleClass || 'c-tabs-nav-toggle'
    this.layerClass = options.layerClass || 'c-tabs-nav-layer'
    this.layerUlClass = options.layerUlClass || 'c-tabs-nav-layer-ul'
    this.allowScroll = options.allowScroll || false // 是否允许滚动
    this.toggleMore = options.toggleMore || false // 是否允许切换显示更多
    this.toggleLabel = options.toggleLabel || '请选择' // 切换label
    this.logClass = options.logClass || 'WA_LOG_TAB' // 统计class
    this.scrollSize = options.scrollSize || '-40' // tabs滚动的size

    this.navs = []
    this.seps = []
    this.conts = []
    this.sum = 0 // tab切换次数
    this.last = null // 上次tab切换序号

    // 函数
    this.onChange = options.onChange || fn
    this.onResetChange = options.onResetChange || fn
    this.onTabScrollEnd = options.onTabScrollEnd

    // init
    panel && this._init(options)
  }

  _init () {
    let $panel = $(this.panel)

    this.toggle = $panel.find('.' + this.toggleClass) // 更多切换按钮
    this.view = $panel.find('.' + this.viewClass) // nav可视区dom
    this.wrapper = $panel.find('.' + this.navWrapperClass) // nav实际区域dom
    this.navs = this.wrapper.find('.' + this.navClass) // nav项
    this.conts = $panel.find('.' + this.contClass) // tabs内容

    this.sum = this.navs.length
    this.tabScroll = undefined

    this._setEvents()
    this.allowScroll && this.view.length && this._setScroll()
    this.toggleMore && this.allowScroll && this.view.length && this._setToggerMore()
  }

  _setWrap ($wrapper) {
    $wrapper.children().eq(0).wrap('<div class="mip-vd-tabs-scroll-touch"></div>')
    // UC浏览器对overflow-x兼容性太差,只能用元素占位的方式来解决
    if ($wrapper.children().eq(1).hasClass(this.toggleClass)) {
      $wrapper.find('.' + this.navWrapperClass).append(
        '<div class="mip-vd-tabs-nav-toggle-holder"></div>'
      )
    }
    return $wrapper
  }

  _setScroll () {
    let _this = this

    _this.tabScroll = _this._setWrap(_this.view)

    // 前置检测选中的tab是否在可视区
    if (_this.current > 0 && _this.current < _this.sum) {
      let currentTab = Math.min(_this.current + 1, _this.sum - 1)
      slideTo(currentTab, 1, _this.navs.eq(_this.current), _this.navs.length, false)
    }

    // 若tab横滑回调方法存在,执行回调
    if (typeof _this.onTabScrollEnd === 'function') {
      _this.tabScroll.on('scrollEnd', function () {
        if (this.customFlag && this.customFlag.autoScroll) {
          // 若为自动触发滑动，不执行回调
          return
        }
        ;
        _this.onTabScrollEnd(this)
      })
    }
  }

  _setToggerMore () {
    let _this = this
    let $navLayer = $('<div class="' + _this.layerClass + '"><p>' + _this.toggleLabel + '</p></div>')
    let $navLayerUl = $('<ul class="' + _this.layerUlClass + '"></ul>')

    _this.toggleState = 0 // 展开状态 0-收起,1-展开

    // 事件代理
    $navLayerUl.on('click', '.' + _this.navClass, function () {
      let $domThis = $(this)
      // $(this).addClass(_this.currentClass);
      _this.navs.eq($domThis.attr('data-tid')).trigger('click')
      toggleUp()
    })

    _this.toggle.on('click', function () {
      if (_this.toggleState === 0) {
        // 点击时为收起
        toggleDown()
      } else {
        // 点击时为展开
        toggleUp()
      };
    })

    // 收起
    function toggleUp () {
      $navLayerUl.empty()
      $navLayer.hide()
      _this.toggle.css({
        '-webkit-transform': 'scaleY(1)',
        'transform': 'scaleY(1)'
      })
      _this.toggleState = 0
    }

    // 展开
    function toggleDown () {
      $navLayerUl.html(_this.navs.clone())
      $navLayer.append($navLayerUl)
      _this.view.after($navLayer.show())
      _this.toggle.css({
        '-webkit-transform': 'scaleY(1)',
        'transform': 'scaleY(-1)'
      })
      _this.toggleState = 1
    }
  }

  _setEvents () {
    let _this = this

    $.each(_this.navs, function (i, v) {
      let $v = $(v)
      if ($v.hasClass(_this.currentClass)) {
        _this.current = i // 获取当前nav序号
      }

      $v.addClass(_this.logClass)
      $v.attr('data-tid', i)

      $v.on('click', function () {
        let tid = parseInt($(this).attr('data-tid'))
        if (tid === _this.current) {
          return
        }

        _this.last = _this.current
        _this.current = tid

        _this.hideTab(_this.last)
        _this.showTab(_this.current)

        if (_this.onResetChange === fn) {
          _this.hideContent(_this.last)
          _this.showContent(_this.current)

          /* 添加异步处理事件，返回点击tab序号及内容框 */
          _this.onChange(_this.current, _this.conts[_this.current])
        } else {
          _this.onResetChange(_this.current)
        }

        // 滑动对象存在,执行滑动并传递autoScroll标记用于scrollEnd事件判断
        if (_this.tabScroll) {
          slideTo(_this.current + 1, 1, $v, _this.navs.length, true)
        };
      })
    })

    // 第一次加载
    $.each(_this.conts, function (i, v) {
      if (i === _this.current) {
        _this.showTab(i)
        _this.showContent(i)
      } else {
        _this.hideTab(i)
        _this.hideContent(i)
      }
    })
  }

  showContent (i) {
    let cont = this.conts[i]
    if (cont) {
      $(this.conts[i]).show()
    }
  }

  hideContent (i) {
    let cont = this.conts[i]
    if (cont) {
      $(cont).hide()
    }
  }

  showTab (i) {
    let navs = this.navs
    $(navs[i]).addClass(this.currentClass)
  }

  hideTab (i) {
    let navs = this.navs
    $(navs[i]).removeClass(this.currentClass)
  }
}

function slideTo (index, leftNum, $thisDom, totalNum, animate) {
  let left = 0
  if (index < leftNum) {

  } else if (index >= totalNum - leftNum) {
    left = $thisDom.parent().offset().width
  } else {
    left = $thisDom.offset().left - $thisDom.parent().offset().left - $thisDom.width()
  }
  if (!inter) {
    if (animate) {
      animateSlide($thisDom.parent().parent().scrollLeft(), left, $thisDom.parent().parent())
    } else {
      $thisDom.parent().parent().scrollLeft(left)
    }
  }
}

function animateSlide (start, end, $dom) {
  let x = (end - start) / 8
  inter = setInterval(function () {
    let scl = $dom.scrollLeft()

    if ((x > 0 && scl >= end) || x === 0) {
      x = 0
      clearInterval(inter)
    } else if (x < 0 && scl <= end) {
      x = 0
      clearInterval(inter)
    }

    $dom.scrollLeft(scl + x)
  }, 30)
  setTimeout(function () { clearInterval(inter); $dom.scrollLeft(end); inter = null }, 270)
}