var ref;

var appdata = {
    user: null,
    history: [{
        name: "root",
        id: "root"
    }],
    father: "root"
}
var g = {}
var app = new Vue({
    el: '#app',
    data: appdata,
    created: function() {
        if (appdata.user) {
            this.load_user()
        }
    },
    methods: {
        logout: function() {
            localStorage.setItem("token", null);
            location.reload();
        },
        auto_load: function(token) {
            g.refroot = new Wilddog("https://woyoutlz-task.wilddogio.com");
            g.refroot.authWithCustomToken(token, this.afterAuth);
        },
        load_user: function() {
            g.refroot = new Wilddog("https://woyoutlz-task.wilddogio.com");
            g.refroot.authWithPassword({
                email: this.tmpuser,
                password: this.tmppass
            }, this.afterAuth);
        },
        afterAuth: function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully with payload:", authData);
                appdata.user = authData.uid
                ref = g.refroot.child("users/" + appdata.user + "/tasks");
                app.makeNowRefOn("root");
                if (app.tmpsave) {
                    localStorage.setItem("token", authData.token)
                }
            }
        },
        onvalue: function(datasnapshot, error) {
            if (error == null) {
                console.log("on", datasnapshot.val());
                // 结果会在 console 中打印出 "beijing"
                app.$set('tasks', datasnapshot.val() || {})
            }
        },
        makeNowRefOn: function(fathername) {
            ref.off("value", this.onvalue);
            ref.orderByChild("father").equalTo(fathername).on("value", this.onvalue);
            if (fathername == "root") {
                return;
            }
            ref.child(fathername + "/content").once("value", function(d, e) {
                if (e == null) {
                    console.log(1, d.val());
                    // 结果会在 console 中打印出 "beijing"
                    app.$set('tmp_content', d.val() || "")
                }
            });
        },
        set_user: function() {
            // this.user = this.tmpuser
            this.load_user()
        },
        add_task: function() {
            if (this.input_task == "") {
                return;
            }

            ref.push({
                title: this.input_task,
                father: appdata.father
            }, function(err) {
                app.input_task = "";
            })
        },
        remove_task: function(index) {
            if (window.confirm("确定删除吗?")) {
                ref.child(index + "").remove()
            }

        },
        edit_task: function(index) {
            var message = prompt("输入新的值", this.tasks[index]["title"]);
            if (message == "") {
                return;
            }
            ref.child(index + "").update({
                title: message
            })
        },
        into_task: function(index) {
            appdata.father = index;
            appdata.history.push({
                id: appdata.father,
                name: app.tasks[index].title,
                content: app.tasks[index].content
            });

            this.makeNowRefOn(appdata.father);
        },
        back_task: function(index) {
            appdata.history = appdata.history.slice(0, index + 1);
            last = appdata.history[appdata.history.length - 1];
            appdata.father = last.id
            this.makeNowRefOn(last.id);
        },
        save_task_content: function() {
            ref.child(appdata.father).update({
                content: this.tmp_content
            })
        }
    }
})

function auto_login() {
    if (localStorage.getItem("token") != null) {
        app.auto_load(localStorage.getItem("token"))
    }
}
auto_login();
