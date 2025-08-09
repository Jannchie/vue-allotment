let _isIOS = false
let _isMacintosh = false
let _userAgent: string | undefined

interface INavigator {
  maxTouchPoints?: number
  userAgent: string
}

declare const navigator: INavigator

// Web environment
if (typeof navigator === 'object') {
  _userAgent = navigator.userAgent
  _isMacintosh = _userAgent.includes('Macintosh')
  _isIOS
    = (_userAgent.includes('Macintosh')
      || _userAgent.includes('iPad')
      || _userAgent.includes('iPhone'))
    && !!navigator.maxTouchPoints
    && navigator.maxTouchPoints > 0
}

export const isIOS = _isIOS
export const isMacintosh = _isMacintosh
