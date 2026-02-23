export function getDeviceId(): string {
    if (typeof window === 'undefined') return '';
    
    const storageKey = 'device_id';
    let deviceId = localStorage.getItem(storageKey);
    
    if (deviceId) return deviceId;
    
    // 新規生成
    const info = {
      ua: navigator.userAgent,
      lang: navigator.language,
      plat: navigator.platform,
      sw: screen.width,
      sh: screen.height,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    const str = JSON.stringify(info);
    deviceId = btoa(str).substring(0, 32);
    localStorage.setItem(storageKey, deviceId);
    
    return deviceId;
  }