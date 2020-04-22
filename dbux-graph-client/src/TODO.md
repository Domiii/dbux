1. done| 改 font (特別要選一個 monospaced font)，讓整個變得比較好看一點 
2. done| 加顏色 （先像我們討論的那樣）  // every context
3. done| 設 canvas width + height = 100%
4. ~~當 canvas (viewport)~~ 改使用HTML 小於你畫出來的圖 (world) 的時候:
   1. 可以用滑鼠來走來走去，像 google maps 一樣 (keyword: pan)
    -> 可以參考 https://www.google.com/search?q=canvas+js+pan+zoom
   2. zoom (exponential)
   3. 不要讓 world bounding box 的四邊的任何一個超越視窗的 bounding box
    -> 另一個講法是：pan + zoom 的時候，都要確認 world bounding box 都不會在 viewport 的外面
    -> hint: 怎麼確保一個「裡面的」巨型永遠都不會在「外面的」巨型的外面？
5. done| node 可以用滑鼠來打開/關掉
6. done| 有小孩的 node 有某個方式讓使用者看到說：「這個 node 是可以打開/關掉的」
7. done| 關掉的 node 的高度可以縮小（像是沒有 children 一樣）
8. 打開的 node 如果有 100 個小孩（或是特別放大時），node 可能會看到，但 node 的 title 看不到了（因為，以目前來講， title 在最上面，但最上面的部分可能目前不在 viewport 裡面），能不能 somehow 讓使用者看到 node 的 title ，能不能讓 title 移到下面？
9. 加一個 `function focus(contextId)`: 把 viewport 從目前的位置自動 pan 到一個地方，使得有 `contextId` 的 trace 在 viewport 的正中間出現
   1. done| 這個 pan 可不可以有一個 animation - 不要馬上移動，反而用 linear interpolation 在一個（可以設定的） 時段 (例如 0.3s) 內慢慢移動
    -> 可以參考 https://www.youtube.com/watch?v=8uLVnM36XUc (x lerp 的基本概念)
   2. 因為一些 node 有兩個 parent：除了直覺的那個 parent 之外有另一個 parent 可能在他的前面出現。當我們 call `focus` 之後，畫出一條線，從被 focus 的 trace 到另一個（前面的） parent
   3. done| 當focus時，加入css flash特效來幫助user確定是哪個div
10. mini map
11. done| 滑輪希望可以往下滑， zoom的功能可能需要兩種方式： (i) zoom button (+ / -), (ii) ctrl + 滑輪 也可以 zoom


1. 邊界
2. minimap/先關掉
3. popper


4. 點擊code，graph會移動
5. 點擊graph可以在vscode顯示
5. 顯示loop的方式可能可以有一個loop的tag，並顯示loop的次數
