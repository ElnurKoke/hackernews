package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		t, err := template.ParseFiles("index.html")
		if err != nil {
			log.Fatal(err)
		}
		t.Execute(w, nil)
	})
	http.HandleFunc("/page", func(w http.ResponseWriter, r *http.Request) {
		t, err := template.ParseFiles("page.html")
		if err != nil {
			log.Fatal(err)
		}
		t.Execute(w, nil)
	})
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	fmt.Println("Server started at http://localhost:8080/")
	http.ListenAndServe(":8080", nil)
}
