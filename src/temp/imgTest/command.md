#!/bin/zsh
tr '\n' ' ' < ~/Dev/renshuCards/src/temp/imgTest/search_results_for_tanoshii.html | grep -oP "class=.boxmeta clearfix..*?<a[^>]*href=[\"']\K[^\"']+"