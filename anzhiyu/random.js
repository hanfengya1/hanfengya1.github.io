var posts=["undefined/永洪bi相关解决方案/","undefined/FineBi相关解决方案/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };