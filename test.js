const str = 'before ![зображення](/be/user-static/uploads/57558db4f4de544d541a6e5f/1480699131567.png) after';


console.log(str.replace(/\!\[[^\]]+\]\(\/be\/user-static.+?png\)/, ''));
