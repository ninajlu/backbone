// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.

$(function() {

  Parse.$ = jQuery;
  Parse.initialize("hxjc7PsqUeQww2KZSMfMp3ZhFajFZHCT0JIPeR1t",
                   "4xUoDlYH26FR6LiJHLJeZ4Ba9VuhGpvO0y647E1r");


  // Post Model
  // ----------

  // Our basic Post model has `content`, `order`, and `done` attributes.
  var Post = Parse.Object.extend("Post", {
    // Default attributes for the todo.
    defaults: {
      content: "empty todo...",
      rank:   -1,
        money_raised:0,
        num_stands:0,
        title: "Test",
        created_by: Parse.User.current(),
        ACL:     new Parse.ACL(Parse.User.current())
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("content")) {
        this.set({"content": this.defaults.content});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }
  });

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // Post Collection
  // ---------------

  var PostList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Post,

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Posts in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Posts are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Post Item View
  // --------------

  // The DOM element for a todo item...
  var PostView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
    },

    // The PostView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Post and a PostView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

  });

  // The Application
  // ---------------

  // The main view that lets a user manage their todo items
  var ManagePostsView = Parse.View.extend({

    // Our template for the line of statistics at the bottom of the app.
    //submitTemplate: _.template($('#submit-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .log-out": "logOut",
      "click #submitbutton": "createOnEnter"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Posts`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved to Parse.
    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne','addAll','render', 'logOut', 'createOnEnter');

      // Main todo management template
      this.$el.html(_.template($("#manage-todos-template").html()));
      
      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      // Create our collection of Posts
      this.todos = new PostList;

      // Setup the query for the collection to look for todos from the current user
      this.todos.query = new Parse.Query(Post);
      //this.todos.query.equalTo("user", Parse.User.current());
        
      this.todos.bind('add',     this.addOne);
      this.todos.bind('all',     this.render);

      // Fetch all the todo items for this user
      this.todos.fetch();
      console.log(this.todos);

      state.on("change", this.filter, this);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var view = new SubmitView();
      this.$('#todo-stats').html(view.render().el);
      this.addAll();
      this.delegateEvents();
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new PostView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },
        // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
      this.$("#todo-list").html("");
      this.todos.each(this.addOne);
    },

    // If you hit return in the main input field, create new Post model
    createOnEnter: function(e) {
      var content = this.$("#content").val();
      var title = this.$("#title").val();
      var image = this.$("#image").val();
      console.log(content);
      var newOne = new Post();
      newOne.save({
        content: content,
        rank:   -1,
        money_raised:0,
        num_stands:0,
        title: title,
        created_by: Parse.User.current(),
        ACL: new Parse.ACL(Parse.User.current())
      }, {success:function(newOne){
        console.log("yay");
      }});
      this.todos.create({
        content: this.input.val(),
        rank:   -1,
        money_raised:0,
        num_stands:0,
        name:    "Test",
        created_by: Parse.User.current(),
        ACL:     new Parse.ACL(Parse.User.current())
      });
      this.input.val('');
      return false;
    }
  });

  var SubmitView = Parse.View.extend({
    events: {
      "submit form.submit-form": "submite"
    },
    
    initialize: function() {
      _.bindAll(this, "submite");
      this.render();
    },

    submite: function(e) {
      var content = this.$("#content").val();
      var title = this.$("#title").val();
      var image = this.$("#image").val();
      console.log(content);
      var newOne = new Post();
      newOne.save({
        content: "content",
        rank:   -1,
        money_raised:0,
        num_stands:0,
        title: "Test",
        created_by: Parse.User.current(),
        ACL: new Parse.ACL(Parse.User.current())
      }, {success:function(newOne){
        console.log("yay");
      }});
    },
    render: function() {
      this.$el.html(_.template($("#submit-template").html()));
      return this;
    }
  });


  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManagePostsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();
      
      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManagePostsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManagePostsView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});

