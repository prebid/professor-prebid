function makeTabsIntoSlidingTabs($tabs) {
	$tabs.find(".myTab").wrapAll("<div style='display:none' />");
	$tabs.append("<div class='slidingTabs' />");
	$tabs.children("div").first().find(".myTab").each(function(i) {
        $tabs.find(".slidingTabs").append($("<div />").addClass("tab").html($(this).html()));
        $(this).children('div').each(function(i) { $(this).remove(); })
    });
	
	$tabs.tabs({
		activate: function(event, ui) {
		var tab = $tabs.tabs("option", "active");
		$tabs.find(".slidingTabs div").first().animate({
			marginLeft: (tab * -100) + '%'
		}, 400, function() {});
		}
	});
}
makeTabsIntoSlidingTabs($("#tabs"));

