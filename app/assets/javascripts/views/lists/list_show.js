Kanban.Views.ListShow = Backbone.View.extend({
	template: JST['lists/show'],
	tagName: "div",
  className: "list",

	initialize: function () {
		var that = this;
		that.model.get("cards").on("all", that.render, that);
	},

	events: {
  	"click div.card": "cardClick",
    "submit form.add_card": "addCard",
    "click button.archive_card": "archiveCard",
	},

  cardClick: function (event) {
  	var that = this;

    // var board = that.model;
    event.stopPropagation();

    var cardId = parseInt($(event.target).data("card-id"));
    var $cardModal = $("section.card_detail");

		var list = that.model;
		var cards = list.get("cards");
		var card = cards.get(cardId);

    card.fetch({
    	success: function (card) {
		    var cardShow = new Kanban.Views.CardShow({
		      model: card,
		    });

		  	$cardModal.html(cardShow.render().$el);
		  	$cardModal.find("article.card_detail").modal();
    	}
    });
  },

  addCard: function (event) {
  	var that = this;

  	event.preventDefault();

    var $scrollPos = $("div.lists_wrapper").scrollLeft();

		var list = that.model;
		var cards = list.get("cards");
		var card = new Kanban.Models.Card();

  	// get form attrs, reset form
  	var $form = $(event.target);
		var attrs = $form.serializeJSON();
		$form[0].reset();

    // add list_id to attrs
    attrs.card.list_id = list.get("id");

		// fail is no card title
    if (!attrs.card.title) {
			var listId = list.get("id");
      var $list = $("div #list_" + listId);
      var $cardInput = $("div #list_" + listId + " input.card_title");

      $cardInput.hide();
      $list.effect("shake", {
        distance: 9,
        times: 2,
        complete: function () {
          $cardInput.show();
          $cardInput.focus();
        }
      }, 350);
      $("div.lists_wrapper").scrollLeft($scrollPos);
      return false;
    }

		// save card
		card.save(attrs.card, {
			success: function (data) {
				cards.add(card);

				// FIXME: re-select card input
				var listId = list.get("id");
	      var $list = $("div #list_" + listId);
	      var $cardInput = $("div #list_" + listId + " input.card_title");
				console.log($cardInput);
				$cardInput.focus();

				// maintain scrollbar position
        $("div.lists").scrollLeft($scrollPos);
			}
		});
  },

  archiveCard: function (event) {
  	var that = this;

    event.stopPropagation();

		var list = that.model;
    var cardId = parseInt($(event.target).data("card-id"));
    var cards = list.get("cards");
		var card = cards.get(cardId);

		// remove list
		card.destroy({
			success: function (data) {
				cards.remove(card);
			}
		});
  },

	render: function () {
		var that = this;
		var list = that.model;
		var list_id = list.get("id");

		that.$el.attr("id", "list_" + list_id);
    that.$el.html(that.template({
      list: list
    }));

		var cards = list.get("cards");
		var cardsIndex = new Kanban.Views.CardsIndex({
			collection: cards
		});

		that.$("section.cards").html(cardsIndex.render().el);

		// sortable for cards
    sortCardsUrl = "/api/cards/sort"
    var $cards = that.$("div.cards");
    $cards.sortable({
      items: "div.card",
      connectWith: ".cards",
      delay: 125,
    	tolerance: "pointer",
      placeholder: "card-placeholder",
 			start: function (e, ui) {
        ui.placeholder.width(ui.item.width());
      	ui.placeholder.height(ui.item.height());
    	},

      update: function (event, ui) {
        var sortData = $(this).sortable("serialize");

        if (sortData) {
	        // add list_id to sortData
	        var listId = parseInt($(this).data("listId"));
	        sortData += '&list_id=' + listId;

	        $.post(sortCardsUrl, sortData, function (resortedCards) {
						var cards = list.get("cards");
						cards.reset(resortedCards.cards);
	        });
        };
      }
    });

		return that;
	}
});
