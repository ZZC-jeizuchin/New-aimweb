/**
 * @file background.js
 * @description 擴充功能的背景服務腳本
 */

// 監聽擴充功能圖示的點擊事件
chrome.action.onClicked.addListener((tab) => {
  // 當圖示被點擊時，建立一個新的分頁
  chrome.tabs.create({
    // 新分頁的 URL 指向擴充功能內的 aimweb.html 檔案
    url: chrome.runtime.getURL('game.html')
  });
});
