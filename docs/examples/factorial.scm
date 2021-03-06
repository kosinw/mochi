;;;
;;; File: examples/factorial.scm 
;;; Copyright (c) 2022 Kosi Nwabueze and Anirudh Rahul
;;;
;;; This program is free software: you can redistribute it and/or modify
;;; it under the terms of the GNU Lesser General Public License as published by
;;; the Free Software Foundation, either version 3 of the License, or
;;; (at your option) any later version.
;;;
;;; This program is distributed in the hope that it will be useful,
;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;;; GNU General Public License for more details.
;;;
;;; You should have received a copy of the GNU Lesser General Public License
;;; along with this program.  If not, see <https://www.gnu.org/licenses/>.
;;;

(define (factorial x)
  (define (fact-iter a product)
      product
      (fact-iter (- a 1) (* product a))))
  (fact-iter x 1))

(factorial 5) ;; 120

(define (factorial x)
  (define (fact-iter a product)
    (if (= a 0)
      product
      (fact-iter (- a 1) (* product a))))
  (fact-iter x 1))

(factorial 5)