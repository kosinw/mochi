(define (factorial x)
  (define (fact-iter a product)
    (if (= a 0)
      product
      (fact-iter (- a 1) (* product a))))
  (fact-iter x 1))

(factorial 5)