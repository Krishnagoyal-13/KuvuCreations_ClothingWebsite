"use client"

import { useState } from "react"
import { Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SizeGuide() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-rose-500 font-medium">
          <Ruler className="h-4 w-4 mr-1" />
          Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Size Guide</DialogTitle>
          <DialogDescription>Find your perfect fit with our detailed size guide</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="inches">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">All measurements are in inches/centimeters</p>
            <TabsList>
              <TabsTrigger value="inches">Inches</TabsTrigger>
              <TabsTrigger value="cm">Centimeters</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inches">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Bust</TableHead>
                  <TableHead>Waist</TableHead>
                  <TableHead>Hips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">XS</TableCell>
                  <TableCell>31-32</TableCell>
                  <TableCell>24-25</TableCell>
                  <TableCell>34-35</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">S</TableCell>
                  <TableCell>33-34</TableCell>
                  <TableCell>26-27</TableCell>
                  <TableCell>36-37</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">M</TableCell>
                  <TableCell>35-36</TableCell>
                  <TableCell>28-29</TableCell>
                  <TableCell>38-39</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">L</TableCell>
                  <TableCell>37-39</TableCell>
                  <TableCell>30-32</TableCell>
                  <TableCell>40-42</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">XL</TableCell>
                  <TableCell>40-42</TableCell>
                  <TableCell>33-35</TableCell>
                  <TableCell>43-45</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="cm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Bust</TableHead>
                  <TableHead>Waist</TableHead>
                  <TableHead>Hips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">XS</TableCell>
                  <TableCell>79-81</TableCell>
                  <TableCell>61-63</TableCell>
                  <TableCell>86-89</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">S</TableCell>
                  <TableCell>84-86</TableCell>
                  <TableCell>66-69</TableCell>
                  <TableCell>91-94</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">M</TableCell>
                  <TableCell>89-91</TableCell>
                  <TableCell>71-74</TableCell>
                  <TableCell>97-99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">L</TableCell>
                  <TableCell>94-99</TableCell>
                  <TableCell>76-81</TableCell>
                  <TableCell>102-107</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">XL</TableCell>
                  <TableCell>102-107</TableCell>
                  <TableCell>84-89</TableCell>
                  <TableCell>109-114</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How to Measure</h4>
          <ul className="text-sm space-y-2">
            <li>
              <strong>Bust:</strong> Measure around the fullest part of your bust, keeping the tape parallel to the
              floor.
            </li>
            <li>
              <strong>Waist:</strong> Measure around your natural waistline, the narrowest part of your torso.
            </li>
            <li>
              <strong>Hips:</strong> Measure around the fullest part of your hips, about 8" below your waistline.
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
