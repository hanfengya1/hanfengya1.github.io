var posts=["2025/06/15/这是一篇新的博文/","2025/06/15/My-New-Post/","2025/06/15/hello-world/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };