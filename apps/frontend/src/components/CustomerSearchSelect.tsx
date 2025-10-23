"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { getCustomersQueryOptions, CustomerDto } from "~/lib/customersFn"
import { useIsMobile } from "~/hooks/use-mobile"
import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "~/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { Label } from "~/components/ui/label"

interface CustomerSearchSelectProps {
  value: CustomerDto | null
  onValueChange: (customer: CustomerDto | null) => void
  label?: string
}

export function CustomerSearchSelect({
  value,
  onValueChange,
  label = "Select Customer",
}: CustomerSearchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const isDesktop = !isMobile

  const { data: customersData, isLoading } = useQuery(getCustomersQueryOptions)

  const customers = customersData?.items || []

  const displayText = value
    ? `${value.fullName} (${value.email || "No email"})`
    : `+ ${label}`

  const CustomerList = () => (
    <Command>
      <CommandInput placeholder="Search by name or email..." />
      <CommandList>
        <CommandEmpty>No customers found.</CommandEmpty>
        {isLoading ? (
          <CommandGroup>
            <CommandItem disabled>Loading customers...</CommandItem>
          </CommandGroup>
        ) : (
          <CommandGroup>
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => {
                  onValueChange(customer)
                  setOpen(false)
                }}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-medium">{customer.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {customer.email || "No email"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {isDesktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {displayText}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <CustomerList />
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {displayText}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mt-4 border-t">
              <CustomerList />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
