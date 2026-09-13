import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import FeatureAssistantDialog from './FeatureAssistantDialog'
import { searchFeatures } from './search'
describe('recovered site guide',()=>{
 it('finds a feature by a natural-language alias',()=>{
  const result=searchFeatures('错题本在哪里？')
  expect(result.mode).toBe('results');expect(result.results[0].id).toBe('wrong-questions')
 })
 it('returns an honest empty or unknown answer',()=>{
  expect(searchFeatures('  ').mode).toBe('empty');expect(searchFeatures('完全不存在的功能xyz').mode).toBe('fallback')
 })
 it('includes preview and planned features without inventing action links',()=>{
  const result=searchFeatures('网站有什么功能？')
  expect(result.mode).toBe('overview')
  expect(result.results.find(x=>x.id==='listening')).toMatchObject({status:'planned',actions:[]})
  expect(result.results.find(x=>x.id==='picture-speaking')).toMatchObject({status:'preview',actions:[]})
 })
 it('opens an existing feature route from an answer',()=>{
  render(<MemoryRouter><Routes><Route path="/" element={<FeatureAssistantDialog open onClose={()=>{}}/>}/><Route path="/wrong-questions" element={<p>已进入错题复习</p>}/></Routes></MemoryRouter>)
  fireEvent.click(screen.getByRole('button',{name:'错题本在哪里？'}))
  fireEvent.click(screen.getByRole('button',{name:'去错题复习'}))
  expect(screen.getByText('已进入错题复习')).toBeInTheDocument()
 })
})
